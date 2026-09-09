/**
 * Database-Backed Rate Limiting
 *
 * Provides rate limiting using Supabase/PostgreSQL for persistence.
 * This scales across multiple server instances and survives restarts.
 *
 * Usage:
 *   const result = await checkRateLimit(`ip:${clientIp}`, RATE_LIMITS.PUBLIC_IP)
 *   if (!result.allowed) {
 *     return rateLimitResponse(result, RATE_LIMITS.PUBLIC_IP.limit)
 *   }
 */

import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export interface RateLimitConfig {
  limit: number
  windowSeconds?: number
}

// ============================================================================
// RATE LIMIT PRESETS
// ============================================================================

/**
 * Default rate limit configurations
 * Adjust these based on your traffic patterns and server capacity
 */
export const RATE_LIMITS = {
  // Public endpoints (login, signup, contact form) - IP-based
  PUBLIC_IP: { limit: 100, windowSeconds: 60 },

  // API key authenticated endpoints - per API key
  API_KEY_DEFAULT: { limit: 100, windowSeconds: 60 },

  // Webhook endpoints - per webhook
  WEBHOOK: { limit: 60, windowSeconds: 60 },

  // Strict limit for sensitive endpoints (password reset, etc.)
  SENSITIVE: { limit: 10, windowSeconds: 60 },

  // Generous limit for read-only endpoints
  READ_ONLY: { limit: 200, windowSeconds: 60 },
} as const

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check and increment rate limit for a given key
 *
 * @param key - Unique identifier (e.g., "ip:192.168.1.1", "apikey:uuid", "webhook:uuid")
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status, remaining requests, and reset time
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .rpc('increment_rate_limit', {
        p_key: key,
        p_limit: config.limit,
        p_window_seconds: config.windowSeconds || 60,
      })
      .single()

    if (error) {
      console.error('[Rate Limit] Database error:', error)
      // Fail open - don't block users due to rate limit errors
      // Log for monitoring and fix the underlying issue
      return {
        allowed: true,
        remaining: config.limit,
        resetAt: new Date(Date.now() + (config.windowSeconds || 60) * 1000),
      }
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetAt: new Date(data.reset_at),
    }
  } catch (err) {
    console.error('[Rate Limit] Unexpected error:', err)
    // Fail open on unexpected errors
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: new Date(Date.now() + (config.windowSeconds || 60) * 1000),
    }
  }
}

// ============================================================================
// KEY BUILDERS
// ============================================================================

/**
 * Build rate limit key for IP-based limiting
 */
export function ipRateLimitKey(ip: string): string {
  return `ip:${ip}`
}

/**
 * Build rate limit key for API key limiting
 */
export function apiKeyRateLimitKey(keyId: string): string {
  return `apikey:${keyId}`
}

/**
 * Build rate limit key for webhook limiting
 */
export function webhookRateLimitKey(webhookId: string): string {
  return `webhook:${webhookId}`
}

/**
 * Build rate limit key for user-based limiting
 */
export function userRateLimitKey(userId: string): string {
  return `user:${userId}`
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a 429 Too Many Requests response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult, limit: number): Response {
  const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait before making more requests.',
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
        'Retry-After': String(retryAfter),
      },
    }
  )
}

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number
): Response {
  // Clone the response to add headers (Response objects are immutable)
  const headers = new Headers(response.headers)
  headers.set('X-RateLimit-Limit', String(limit))
  headers.set('X-RateLimit-Remaining', String(result.remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt.getTime() / 1000)))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Extract client IP from request headers
 * Checks common headers set by proxies/load balancers
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers

  // Vercel/Cloudflare headers
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // X-Forwarded-For (may contain comma-separated list)
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim())
    // Return the first (original client) IP
    if (ips[0]) return ips[0]
  }

  // X-Real-IP (single IP)
  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Fallback - this shouldn't happen in production with proper proxy config
  return 'unknown'
}
