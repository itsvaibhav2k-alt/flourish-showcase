'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const origin = window.location.origin

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Always show success for security - don't reveal if email exists
      setSubmitted(true)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-neutral-500">
            If an account exists with that email, we sent you a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg text-center">
            Check your inbox and click the link to reset your password.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-500">
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Forgot password?</CardTitle>
        <CardDescription className="text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20 transition-smooth font-medium"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-neutral-500">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
