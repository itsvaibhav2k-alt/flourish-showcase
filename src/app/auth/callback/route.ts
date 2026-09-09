import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth Callback Route Handler
 *
 * Handles all authentication callbacks:
 * - OAuth (Google) redirects with ?code=
 * - Magic link verification with ?token_hash= and ?type=magiclink
 * - Email verification with ?token_hash= and ?type=signup
 * - Password reset with ?token_hash= and ?type=recovery
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/contacts'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle OAuth errors (e.g., user cancelled)
  if (error) {
    const errorUrl = new URL('/login', origin)
    errorUrl.searchParams.set('error', error_description || error)
    return NextResponse.redirect(errorUrl)
  }

  const supabase = await createClient()

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError)
      const errorUrl = new URL('/login', origin)
      errorUrl.searchParams.set('error', `Auth error: ${exchangeError.message}`)
      return NextResponse.redirect(errorUrl)
    }

    if (data.user) {
      // Check if user has an organization
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .limit(1)

      if (!memberships || memberships.length === 0) {
        // New user without organization - redirect to onboarding
        return NextResponse.redirect(new URL('/onboarding', origin))
      }

      // Set organization cookie for existing user
      const response = NextResponse.redirect(new URL(next, origin))
      response.cookies.set('organization-id', memberships[0].organization_id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return response
    }
  }

  // Handle token-based verification (magic links, email verification, password reset)
  if (token_hash && type) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'magiclink' | 'email',
    })

    if (verifyError) {
      console.error('OTP verification error:', verifyError)

      // Determine appropriate error page based on type
      let errorUrl: URL
      if (type === 'recovery') {
        errorUrl = new URL('/forgot-password', origin)
        errorUrl.searchParams.set('error', 'Reset link expired or invalid. Please request a new one.')
      } else if (type === 'signup' || type === 'email') {
        errorUrl = new URL('/verify-email', origin)
        errorUrl.searchParams.set('error', 'Verification link expired or invalid.')
        errorUrl.searchParams.set('expired', 'true')
      } else {
        errorUrl = new URL('/login', origin)
        errorUrl.searchParams.set('error', 'Login link expired or invalid. Please try again.')
      }
      return NextResponse.redirect(errorUrl)
    }

    // Handle successful verification based on type
    if (type === 'recovery') {
      // Password reset - redirect to reset password page
      return NextResponse.redirect(new URL('/reset-password', origin))
    }

    if (type === 'signup' || type === 'email') {
      // Email verification successful
      if (data.user) {
        // Check if user has an organization
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          // User verified but no org - redirect to onboarding
          return NextResponse.redirect(new URL('/onboarding', origin))
        }

        // Set organization cookie and redirect to dashboard
        const response = NextResponse.redirect(new URL(next, origin))
        response.cookies.set('organization-id', memberships[0].organization_id, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        return response
      }
    }

    if (type === 'magiclink') {
      // Magic link login
      if (data.user) {
        // Check if user has an organization
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          // New user via magic link - redirect to onboarding
          return NextResponse.redirect(new URL('/onboarding', origin))
        }

        // Set organization cookie and redirect
        const response = NextResponse.redirect(new URL(next, origin))
        response.cookies.set('organization-id', memberships[0].organization_id, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        return response
      }
    }
  }

  // Fallback - redirect to login with error
  const errorUrl = new URL('/login', origin)
  errorUrl.searchParams.set('error', 'Invalid authentication request.')
  return NextResponse.redirect(errorUrl)
}
