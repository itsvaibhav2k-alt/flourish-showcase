'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validatePassword = (): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validatePassword()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Redirect to login with success message
      router.push('/login?message=Password updated successfully')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-card border-neutral-100 bg-white/90 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Reset password</CardTitle>
        <CardDescription className="text-neutral-500">
          Enter your new password below
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
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
            <p className="text-xs text-neutral-500">Must be at least 8 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20 transition-smooth font-medium"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
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
