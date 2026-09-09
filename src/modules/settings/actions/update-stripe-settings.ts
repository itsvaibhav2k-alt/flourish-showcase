'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import { encrypt } from '@/lib/encryption'

type ActionResult = {
  success: boolean
  error?: string
}

interface UpdateStripeSettingsInput {
  publishableKey: string
  secretKey?: string // Optional - only provided when updating
  webhookSecret?: string // Optional - only provided when updating
  mode: 'test' | 'live'
}

/**
 * Update Stripe integration settings for the organization.
 * Encrypts sensitive keys (secret_key, webhook_secret) before storing.
 * Publishable key is stored in plain text as it's meant to be public.
 */
export async function updateStripeSettings(
  input: UpdateStripeSettingsInput
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update Stripe settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to update Stripe settings without admin role',
        { role }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can update Stripe settings.',
      }
    }

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Validate publishable key format
    if (input.publishableKey) {
      if (!input.publishableKey.startsWith('pk_test_') && !input.publishableKey.startsWith('pk_live_')) {
        return {
          success: false,
          error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_',
        }
      }
    }

    // Validate secret key format if provided
    if (input.secretKey) {
      if (!input.secretKey.startsWith('sk_test_') && !input.secretKey.startsWith('sk_live_')) {
        return {
          success: false,
          error: 'Invalid secret key format. Must start with sk_test_ or sk_live_',
        }
      }
    }

    // Validate webhook secret format if provided
    if (input.webhookSecret) {
      if (!input.webhookSecret.startsWith('whsec_')) {
        return {
          success: false,
          error: 'Invalid webhook secret format. Must start with whsec_',
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      stripe_publishable_key: input.publishableKey || null,
      stripe_mode: input.mode,
    }

    // Only update encrypted fields if new values are provided
    if (input.secretKey) {
      updateData.stripe_secret_key_encrypted = encrypt(input.secretKey)
    }

    if (input.webhookSecret) {
      updateData.stripe_webhook_secret_encrypted = encrypt(input.webhookSecret)
    }

    // Create Supabase client
    const supabase = await createClient()

    // Update organization
    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating Stripe settings:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate settings page
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateStripeSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update Stripe settings',
    }
  }
}
