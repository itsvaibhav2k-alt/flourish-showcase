'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  const expired = searchParams.get('expired')

  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!email) return

    setResendLoading(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch {
      setResendError('Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 text-primary-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {expired ? 'Verification link expired' : 'Check your email'}
        </CardTitle>
        <CardDescription className="text-neutral-500">
          {expired ? (
            <>We sent you a new verification link. Please check your inbox.</>
          ) : (
            <>
              We sent a verification link to{' '}
              <span className="font-medium text-neutral-900">{email || 'your email'}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {(error || resendError) && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error || resendError}
          </div>
        )}

        {resendSuccess && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
            Verification email sent! Please check your inbox.
          </div>
        )}

        <div className="text-center text-sm text-neutral-600 space-y-2">
          <p>Click the link in your email to verify your account.</p>
          <p className="text-neutral-500">
            The link will expire in 24 hours.
          </p>
        </div>

        {email && (
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={resendLoading || resendSuccess}
            >
              {resendLoading ? 'Sending...' : resendSuccess ? 'Email sent!' : 'Resend verification email'}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-neutral-500">
          Wrong email?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign up again
          </Link>
        </div>
        <div className="text-sm text-center text-neutral-500">
          Already verified?{' '}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-neutral-500">Loading...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
