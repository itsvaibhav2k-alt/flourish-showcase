'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

type LoginMethod = 'password' | 'magic-link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Handle URL error params (for OAuth errors from callback)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    if (errorParam) {
      setError(errorDescription || errorParam)
    }
  }, [searchParams])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Fetch user's organization membership and set cookie
      if (data.user) {
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          // User has no organization - redirect to onboarding
          router.push('/onboarding')
          router.refresh()
          return
        }

        // Set organization cookie (same pattern as onboarding page)
        document.cookie = `organization-id=${memberships[0].organization_id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      }

      router.push('/contacts')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess('Check your email for the magic link')
      setEmail('')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setSuccess(null)
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
      // Note: On success, the page will redirect, so we don't reset loading
    } catch (err) {
      console.error('Google sign in error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
          Welcome back
        </h1>
        <p className="text-neutral-500">
          Sign in to continue to Flourish
        </p>
      </div>

      {/* Form container - clean, no heavy glassmorphism */}
      <div className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-neutral-200 bg-white hover:bg-neutral-50 font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-50 px-3 text-neutral-400 font-medium tracking-wider">or</span>
          </div>
        </div>

        {/* Login Method Tabs */}
        <div className="flex rounded-xl border border-neutral-200 p-1 bg-white">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password')
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === 'password'
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('magic-link')
              setError(null)
              setSuccess(null)
            }}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              loginMethod === 'magic-link'
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Password Form */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-white border-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-neutral-700">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-white border-neutral-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 font-medium rounded-xl"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </Button>
          </form>
        )}

        {/* Magic Link Form */}
        {loginMethod === 'magic-link' && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email" className="text-sm font-medium text-neutral-700">Email</Label>
              <Input
                id="magic-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-white border-neutral-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 font-medium rounded-xl"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </span>
              ) : 'Send magic link'}
            </Button>
            <p className="text-xs text-center text-neutral-500">
              We&apos;ll send you a link to sign in without a password
            </p>
          </form>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
            Welcome back
          </h1>
          <p className="text-neutral-500">
            Loading...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
