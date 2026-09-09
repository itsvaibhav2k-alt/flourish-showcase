/**
 * CORS Configuration for API v1
 *
 * Restricts cross-origin requests to trusted domains only.
 * This prevents unauthorized websites from making API requests on behalf of users.
 *
 * Note: API key authenticated endpoints can be accessed from anywhere
 * since authentication is via header, not cookies. However, restricting
 * CORS still provides defense-in-depth against credential theft.
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * List of allowed origins for CORS
 * Add any additional trusted domains here
 */
const ALLOWED_ORIGINS = [
  'https://flourishnpo.com',
  'https://www.flourishnpo.com',
  // Development environments
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []),
  // Vercel preview deployments
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
]

/**
 * Allowed HTTP methods for API v1 endpoints
 */
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'

/**
 * Allowed headers in requests
 */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-API-Key',
  'X-Request-ID',
  'X-Requested-With',
].join(', ')

/**
 * Max age for preflight cache (24 hours)
 */
const MAX_AGE = '86400'

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Check if an origin is in the allowed list
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Get CORS headers for a request
 * Returns empty object if origin is not allowed
 */
export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin')

  // If origin is allowed, return CORS headers with that origin
  if (origin && isOriginAllowed(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Max-Age': MAX_AGE,
      'Access-Control-Allow-Credentials': 'false', // No cookies for API v1
    }
  }

  // If no origin or not allowed, don't set CORS headers
  // Browser will block cross-origin requests
  return {}
}

/**
 * Handle CORS preflight OPTIONS request
 * Returns a 204 No Content response with CORS headers
 */
export function handleCorsOptions(req: NextRequest): NextResponse {
  const corsHeaders = getCorsHeaders(req)

  // If origin is not allowed, return 403
  if (Object.keys(corsHeaders).length === 0) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'CORS error: Origin not allowed',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * Add CORS headers to an existing response
 */
export function addCorsHeaders(req: NextRequest, response: NextResponse): NextResponse {
  const corsHeaders = getCorsHeaders(req)

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }

  return response
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  req: NextRequest,
  data: unknown,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  return addCorsHeaders(req, response)
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(
  req: NextRequest,
  error: string,
  status: number = 400
): NextResponse {
  return corsJsonResponse(req, { success: false, error }, status)
}
