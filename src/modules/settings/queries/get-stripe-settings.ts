'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface StripeSettings {
  publishableKey: string
  secretKey: string  // Will be masked as ********
  webhookSecret: string  // Will be masked as ********
  mode: 'test' | 'live'
  isConnected: boolean
}

/**
 * Get Stripe settings for the current organization
 * Sensitive keys are masked for security
 */
export async function getStripeSettings(): Promise<StripeSettings | null> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('stripe_publishable_key, stripe_secret_key_encrypted, stripe_webhook_secret_encrypted, stripe_mode')
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    // Return silently - columns may not exist yet
    return null
  }

  const hasSecretKey = !!data.stripe_secret_key_encrypted
  const hasWebhookSecret = !!data.stripe_webhook_secret_encrypted
  const isConnected = !!(data.stripe_publishable_key && hasSecretKey)

  return {
    publishableKey: data.stripe_publishable_key || '',
    secretKey: hasSecretKey ? '********' : '',
    webhookSecret: hasWebhookSecret ? '********' : '',
    mode: (data.stripe_mode as 'test' | 'live') || 'test',
    isConnected,
  }
}
