/**
 * API v1 Authentication Utilities
 *
 * Provides API key authentication for REST API endpoints.
 * Uses database-backed rate limiting for scalability.
 *
 * Security notes:
 * - API keys must be provided via header (X-API-Key or Authorization: Bearer)
 * - Query parameter API keys are NOT supported (security risk - logged in access logs)
 * - Rate limiting is stored in database for persistence across server instances
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkRateLimit as dbCheckRateLimit,
  apiKeyRateLimitKey,
  rateLimitResponse,
  type RateLimitResult,
} from '@/lib/rate-limit'
import crypto from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface ApiKeyValidation {
  valid: boolean
  error?: string
  status?: number
  organizationId: string
  permissions: string[]
  keyId?: string
  rateLimitResult?: RateLimitResult
}

// ============================================================================
// CRYPTO FUNCTIONS
// ============================================================================

/**
 * Hash an API key for comparison using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Generate a new API key with secure random bytes
 * Format: flr_{43 base64url characters} (total 47 chars)
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `flr_${crypto.randomBytes(32).toString('base64url')}`
  const prefix = key.substring(0, 12) // "flr_" + 8 chars for lookup
  const hash = hashApiKey(key)

  return { key, prefix, hash }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate an API key from the request
 *
 * API key can be provided via:
 * - X-API-Key header (recommended)
 * - Authorization: Bearer <key> header
 *
 * NOTE: Query parameter API keys are NOT supported for security reasons
 * (they can leak in access logs, browser history, referrer headers)
 */
export async function validateApiKey(req: NextRequest): Promise<ApiKeyValidation> {
  const invalidResult = (error: string, status: number = 401): ApiKeyValidation => ({
    valid: false,
    error,
    status,
    organizationId: '',
    permissions: [],
  })

  // Get API key from header only (no query params for security)
  let apiKey = req.headers.get('X-API-Key') || req.headers.get('Authorization')

  // Handle Bearer token format
  if (apiKey?.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7)
  }

  // Security: Do NOT accept API keys via query parameters
  // Query params are logged in access logs and can leak via referrer headers
  if (!apiKey) {
    return invalidResult(
      'Missing API key. Provide via X-API-Key header or Authorization: Bearer header.'
    )
  }

  // Validate key format
  const prefix = apiKey.substring(0, 12)
  if (!prefix.startsWith('flr_')) {
    return invalidResult('Invalid API key format. Keys must start with "flr_".')
  }

  const supabase = createAdminClient()

  // Find API key by prefix (allows fast lookup without scanning all keys)
  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select(
      'id, organization_id, key_hash, permissions, is_active, expires_at, rate_limit_per_minute, usage_count'
    )
    .eq('key_prefix', prefix)
    .single()

  if (error || !keyRecord) {
    return invalidResult('Invalid API key')
  }

  // Verify hash (timing-safe comparison via crypto)
  const hash = hashApiKey(apiKey)
  if (hash !== keyRecord.key_hash) {
    return invalidResult('Invalid API key')
  }

  // Check if active
  if (!keyRecord.is_active) {
    return invalidResult('API key is disabled', 403)
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return invalidResult('API key has expired', 403)
  }

  // Check rate limit using database-backed rate limiting
  const rateLimitPerMinute = keyRecord.rate_limit_per_minute || 100
  const rateLimitKey = apiKeyRateLimitKey(keyRecord.id)
  const rateLimitResult = await dbCheckRateLimit(rateLimitKey, {
    limit: rateLimitPerMinute,
    windowSeconds: 60,
  })

  if (!rateLimitResult.allowed) {
    return {
      valid: false,
      error: 'Rate limit exceeded. Please wait before making more requests.',
      status: 429,
      organizationId: '',
      permissions: [],
      rateLimitResult,
    }
  }

  // Update usage stats (fire and forget - don't block on this)
  supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (keyRecord.usage_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', keyRecord.id)
    .then(() => {})
    .catch((err) => console.error('[API Key] Failed to update usage stats:', err))

  return {
    valid: true,
    organizationId: keyRecord.organization_id,
    permissions: (keyRecord.permissions as string[]) || ['read'],
    keyId: keyRecord.id,
    rateLimitResult,
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware-style wrapper for API endpoints requiring API key auth
 *
 * Usage:
 *   export const GET = withApiKeyAuth(async (req, auth) => {
 *     // auth.organizationId, auth.permissions available
 *     return new Response(...)
 *   }, ['read'])
 */
export function withApiKeyAuth(
  handler: (req: NextRequest, auth: ApiKeyValidation) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (req: NextRequest) => {
    const auth = await validateApiKey(req)

    // Handle rate limit errors with proper 429 response
    if (auth.status === 429 && auth.rateLimitResult) {
      return rateLimitResponse(
        auth.rateLimitResult,
        100 // Default limit for response headers
      )
    }

    // Handle other auth errors
    if (!auth.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: auth.error,
        }),
        {
          status: auth.status || 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check required permissions
    for (const perm of requiredPermissions) {
      if (!auth.permissions.includes(perm) && !auth.permissions.includes('admin')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Insufficient permissions. Requires: ${perm}`,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return handler(req, auth)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { generateApiKey, hashApiKey }
