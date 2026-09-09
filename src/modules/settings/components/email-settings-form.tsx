'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { updateEmailSettings } from '../actions/update-organization'
import type { EmailSettings } from '../schemas/organization'

interface EmailSettingsFormProps {
  emailSettings: EmailSettings
}

export function EmailSettingsForm({ emailSettings }: EmailSettingsFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [emailFrom, setEmailFrom] = React.useState(emailSettings.email_from || '')
  const [emailSignature, setEmailSignature] = React.useState(emailSettings.email_signature || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateEmailSettings({
        email_from: emailFrom || undefined,
        email_signature: emailSignature || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update email settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
          Email settings saved successfully!
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Configure how emails are sent from your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-from">From Address</Label>
            <Input
              id="email-from"
              type="email"
              value={emailFrom}
              onChange={e => setEmailFrom(e.target.value)}
              placeholder="noreply@yourorg.org"
            />
            <p className="text-xs text-neutral-500">
              The email address that will appear in the &quot;From&quot; field
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signature">Email Signature</Label>
            <Textarea
              id="email-signature"
              value={emailSignature}
              onChange={e => setEmailSignature(e.target.value)}
              placeholder="Your email signature..."
              rows={4}
            />
            <p className="text-xs text-neutral-500">
              This will be automatically added to the end of all emails
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
