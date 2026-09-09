'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { publicVolunteerSignup } from '../actions/public-signup'

interface PublicSignupFormProps {
  orgSlug: string
  shiftId: string
  shiftTitle: string
  isFull?: boolean
}

export function PublicSignupForm({ orgSlug, shiftId, shiftTitle, isFull = false }: PublicSignupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      orgSlug,
      shiftId,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    try {
      const result = await publicVolunteerSignup(data)

      if (result.success) {
        // Redirect to success page with shift info
        router.push(`/public/shifts/${orgSlug}/success?shift=${encodeURIComponent(shiftTitle)}&status=${result.data?.status}&shiftId=${shiftId}`)
      } else {
        setError(result.error || 'Failed to sign up. Please try again.')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isFull ? 'Join Waitlist' : 'Sign Up for This Shift'}
        </CardTitle>
        <CardDescription>
          {isFull
            ? 'This shift is currently full. Join the waitlist and we\'ll notify you if a spot opens up.'
            : 'Fill out the form below to register as a volunteer'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                required
                placeholder="John"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                required
                placeholder="Doe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-600">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="john.doe@example.com"
              disabled={isSubmitting}
            />
            <p className="text-xs text-neutral-500">
              We&apos;ll send a confirmation to this email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any questions or special requirements?"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (isFull ? 'Joining Waitlist...' : 'Signing Up...')
              : (isFull ? 'Join Waitlist' : 'Complete Sign Up')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
