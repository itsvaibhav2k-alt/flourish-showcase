'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StripeConnectionStatus, type ConnectionStatus } from './stripe-connection-status'
import { updateStripeSettings } from '../actions/update-stripe-settings'
import { testStripeConnection } from '../actions/test-stripe-connection'

export interface StripeSettings {
  publishableKey: string
  secretKey: string
  webhookSecret: string
  mode: 'test' | 'live'
  isConnected: boolean
}

interface StripeSettingsFormProps {
  initialSettings?: Partial<StripeSettings>
}

export function StripeSettingsForm({ initialSettings }: StripeSettingsFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(
    initialSettings?.isConnected ? 'connected' : 'disconnected'
  )

  // Form state
  const [publishableKey, setPublishableKey] = React.useState(initialSettings?.publishableKey || '')
  const [secretKey, setSecretKey] = React.useState('')
  const [webhookSecret, setWebhookSecret] = React.useState('')
  const [isLiveMode, setIsLiveMode] = React.useState(initialSettings?.mode === 'live')

  // Track if secret fields have been modified (to show placeholder vs actual input)
  const [secretKeyModified, setSecretKeyModified] = React.useState(false)
  const [webhookSecretModified, setWebhookSecretModified] = React.useState(false)

  // Check if org has existing keys
  const hasExistingSecretKey = initialSettings?.secretKey === '********'
  const hasExistingWebhookSecret = initialSettings?.webhookSecret === '********'

  const handleTestConnection = async () => {
    setIsTesting(true)
    setError(null)
    setConnectionStatus('testing')

    try {
      // Use the current form values, or existing keys if not modified
      const result = await testStripeConnection({
        publishableKey,
        secretKey: secretKeyModified ? secretKey : undefined,
        useExisting: !secretKeyModified && hasExistingSecretKey,
      })

      if (result.success) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
        setError(result.error || 'Connection test failed')
      }
    } catch (err) {
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateStripeSettings({
        publishableKey,
        secretKey: secretKeyModified ? secretKey : undefined,
        webhookSecret: webhookSecretModified ? webhookSecret : undefined,
        mode: isLiveMode ? 'live' : 'test',
      })

      if (result.success) {
        setSuccess(true)
        // Reset modified flags since changes are saved
        setSecretKeyModified(false)
        setWebhookSecretModified(false)
        setSecretKey('')
        setWebhookSecret('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to save Stripe settings')
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
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">
          Stripe settings saved successfully!
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stripe Integration</CardTitle>
              <CardDescription>
                Connect your Stripe account to accept online donations
              </CardDescription>
            </div>
            <StripeConnectionStatus
              status={connectionStatus}
              mode={connectionStatus === 'connected' ? (isLiveMode ? 'live' : 'test') : undefined}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="stripe-mode" className="text-base font-medium">
                Live Mode
              </Label>
              <p className="text-sm text-neutral-500">
                {isLiveMode
                  ? 'Your Stripe account is in live mode. Real payments will be processed.'
                  : 'Your Stripe account is in test mode. Use test cards for testing.'}
              </p>
            </div>
            <Switch
              id="stripe-mode"
              checked={isLiveMode}
              onCheckedChange={setIsLiveMode}
            />
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishable-key">Publishable Key</Label>
            <Input
              id="publishable-key"
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder={isLiveMode ? 'pk_live_...' : 'pk_test_...'}
            />
            <p className="text-xs text-neutral-500">
              Your Stripe publishable key (starts with pk_)
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret-key">Secret Key</Label>
            <Input
              id="secret-key"
              type="password"
              value={secretKeyModified ? secretKey : ''}
              onChange={(e) => {
                setSecretKey(e.target.value)
                setSecretKeyModified(true)
              }}
              placeholder={
                hasExistingSecretKey && !secretKeyModified
                  ? '********** (saved)'
                  : isLiveMode
                    ? 'sk_live_...'
                    : 'sk_test_...'
              }
            />
            <p className="text-xs text-neutral-500">
              Your Stripe secret key (starts with sk_). This will be encrypted before storage.
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <Input
              id="webhook-secret"
              type="password"
              value={webhookSecretModified ? webhookSecret : ''}
              onChange={(e) => {
                setWebhookSecret(e.target.value)
                setWebhookSecretModified(true)
              }}
              placeholder={
                hasExistingWebhookSecret && !webhookSecretModified
                  ? '********** (saved)'
                  : 'whsec_...'
              }
            />
            <p className="text-xs text-neutral-500">
              Your Stripe webhook signing secret (starts with whsec_). Found in your Stripe
              Dashboard under Webhooks.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || isLoading || (!publishableKey && !hasExistingSecretKey)}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button type="submit" disabled={isLoading || isTesting}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
