'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            organization_name: organization,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Note: Organization creation moved to onboarding page after email verification
      // This ensures the user has a valid session when creating the organization

      // Redirect to verify email page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
          Get started
        </h1>
        <p className="text-neutral-500">
          Create your account to start using Flourish
        </p>
      </div>

      {/* Form container - clean design */}
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-neutral-700">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 rounded-xl bg-white border-neutral-200"
            />
          </div>

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
            <Label htmlFor="organization" className="text-sm font-medium text-neutral-700">Organization Name</Label>
            <Input
              id="organization"
              type="text"
              placeholder="My Nonprofit Organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
              className="h-12 rounded-xl bg-white border-neutral-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-neutral-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-12 rounded-xl bg-white border-neutral-200"
            />
            <p className="text-xs text-neutral-400 mt-1">Minimum 8 characters</p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 font-medium rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Creating account...
              </span>
            ) : 'Create account'}
          </Button>

          <p className="text-xs text-center text-neutral-400 pt-2">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Privacy Policy
            </Link>
          </p>
        </form>
      </div>

      {/* Footer link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
