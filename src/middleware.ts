import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

/**
 * Security Headers
 *
 * Add security headers to all responses following OWASP best practices.
 * Headers include CSP, X-Frame-Options, HSTS, and other protections.
 */
function addSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Content Security Policy directives
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.anthropic.com wss://*.supabase.co https://vercel.live",
    "frame-src 'self' https://js.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Only upgrade insecure requests in production (breaks localhost dev)
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
  ]

  // Allow framing for embed routes (external calendar embeds, etc.)
  if (pathname.startsWith('/embed/')) {
    const embedCsp = cspDirectives.filter(d => !d.startsWith('frame-ancestors'))
    embedCsp.push("frame-ancestors *")
    response.headers.set('Content-Security-Policy', embedCsp.join('; '))
  } else {
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
    response.headers.set('X-Frame-Options', 'DENY')
  }

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // XSS protection (legacy but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Restrict browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)')

  // HSTS - only in production to avoid issues with local development
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

/**
 * Next.js Middleware
 *
 * This middleware runs on every request and handles:
 * 1. Refreshing Supabase auth sessions
 * 2. Protecting authenticated routes (redirecting to login if not authenticated)
 * 3. Setting organization context headers
 * 4. Allowing public routes
 * 5. Adding security headers to all responses
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth checks if Supabase is not configured (demo mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return addSecurityHeaders(NextResponse.next(), pathname)
  }

  // DEVELOPMENT ONLY: Bypass auth for UI preview
  if (process.env.BYPASS_AUTH === 'true') {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      throw new Error('BYPASS_AUTH cannot be enabled in production')
    }
    const response = NextResponse.next()
    // Always set organization cookie to demo org in bypass mode
    const demoOrgId = '00000000-0000-0000-0000-000000000001'
    response.cookies.set('organization-id', demoOrgId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'lax',
    })
    return addSecurityHeaders(response, pathname)
  }

  // Update the Supabase session
  const { response, user, error } = await updateSession(request)

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isPublicApiRoute = pathname.startsWith('/api/inngest') || pathname.startsWith('/auth/callback') || pathname.startsWith('/api/webhooks/')
  const isPublicShiftsRoute = pathname.startsWith('/public/')
  const isEmbedRoute = pathname.startsWith('/embed/')
  const isDonateRoute = pathname.startsWith('/donate/')
  const isMarketingRoute = ['/features', '/pricing', '/about', '/contact', '/privacy', '/terms'].includes(pathname)
  const isImpactRoute = pathname.startsWith('/impact/')

  // If user is logged in and on a public auth page, redirect to dashboard
  const authPages = ['/', '/login', '/signup']
  if (user && !error && authPages.includes(pathname)) {
    // Check if user has verified email
    if (user.email_confirmed_at) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
    }
  }

  // Allow public routes and API routes without authentication
  if (isPublicRoute || isPublicApiRoute || isPublicShiftsRoute || isEmbedRoute || isDonateRoute || isMarketingRoute || isImpactRoute) {
    return addSecurityHeaders(response, pathname)
  }

  // Semi-public route: onboarding requires auth but not organization
  if (pathname === '/onboarding') {
    if (!user || error) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
    }
    return addSecurityHeaders(response, pathname)
  }

  // Protected routes - require authentication
  const protectedPrefixes = ['/dashboard', '/contacts', '/donors', '/volunteers', '/communications', '/settings', '/reports', '/donations', '/team-analytics', '/flora', '/pipeline', '/prospects', '/calendar']
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (isProtectedRoute) {
    if (!user || error) {
      // User is not authenticated, redirect to login
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', pathname)
      return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
    }

    // Check if email is verified (required for protected routes)
    if (!user.email_confirmed_at) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/verify-email'
      if (user.email) {
        redirectUrl.searchParams.set('email', user.email)
      }
      return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
    }

    // User is authenticated - set organization context header if available
    const organizationId = request.cookies.get('organization-id')?.value
    if (organizationId) {
      response.headers.set('X-Organization-Id', organizationId)
    }
  }

  return addSecurityHeaders(response, pathname)
}

/**
 * Matcher configuration
 * This tells Next.js which routes to run the middleware on.
 * We exclude static files and Next.js internal routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
