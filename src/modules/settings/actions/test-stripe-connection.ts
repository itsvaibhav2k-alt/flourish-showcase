'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import { decrypt } from '@/lib/encryption'

type ActionResult = {
  success: boolean
  error?: string
  accountName?: string
}

interface TestStripeConnectionInput {
  publishableKey: string
  secretKey?: string // Optional - new key to test
  useExisting?: boolean // Whether to use the existing stored key
}

/**
 * Test the Stripe connection by making a test API call.
 * Uses stripe.balance.retrieve() as a simple connectivity test.
 */
export async function testStripeConnection(
  input: TestStripeConnectionInput
): Promise<ActionResult> {
  try {
    // Check user role - only admins can test Stripe connection
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can test Stripe connection.',
      }
    }

    let secretKey = input.secretKey

    // If using existing key, fetch and decrypt it from the database
    if (input.useExisting && !secretKey) {
      const organizationId = await getCurrentOrganizationId()
      if (!organizationId) {
        return {
          success: false,
          error: 'No organization selected',
        }
      }

      const supabase = await createClient()
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('stripe_secret_key_encrypted')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        console.error('Error fetching Stripe settings:', fetchError)
        return {
          success: false,
          error: 'Failed to retrieve Stripe settings',
        }
      }

      if (!org.stripe_secret_key_encrypted) {
        return {
          success: false,
          error: 'No Stripe secret key configured',
        }
      }

      try {
        secretKey = decrypt(org.stripe_secret_key_encrypted)
      } catch (decryptError) {
        console.error('Error decrypting Stripe key:', decryptError)
        return {
          success: false,
          error: 'Failed to decrypt Stripe key',
        }
      }
    }

    if (!secretKey) {
      return {
        success: false,
        error: 'No secret key provided',
      }
    }

    // Validate secret key format
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      return {
        success: false,
        error: 'Invalid secret key format',
      }
    }

    // Create a temporary Stripe client with the provided key
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })

    // Test the connection by retrieving the balance
    // This is a simple, read-only operation that verifies API connectivity
    await stripe.balance.retrieve()

    // Optionally get the account name for display
    let accountName: string | undefined
    try {
      const account = await stripe.accounts.retrieve()
      accountName = account.business_profile?.name || account.settings?.dashboard?.display_name || undefined
    } catch {
      // Account retrieval may fail for connect accounts, which is fine
    }

    return {
      success: true,
      accountName,
    }
  } catch (error) {
    console.error('Error testing Stripe connection:', error)

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return {
        success: false,
        error: 'Invalid API key. Please check your secret key.',
      }
    }

    if (error instanceof Stripe.errors.StripePermissionError) {
      return {
        success: false,
        error: 'API key does not have permission to perform this operation.',
      }
    }

    if (error instanceof Stripe.errors.StripeConnectionError) {
      return {
        success: false,
        error: 'Unable to connect to Stripe. Please check your internet connection.',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}
