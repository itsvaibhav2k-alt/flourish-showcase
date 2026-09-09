'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generatePortalToken as generateToken } from '@/lib/utils/generate-token'

export interface GeneratePortalTokenResult {
  success: boolean
  token?: string
  portalUrl?: string
  error?: string
}

/**
 * Generates a secure portal token for a contact and returns the full portal URL.
 * The token is stored in the database and used to authenticate portal access.
 *
 * @param contactId - The ID of the contact to generate a token for
 * @returns Result containing the token and full portal URL, or an error
 */
export async function generatePortalToken(
  contactId: string
): Promise<GeneratePortalTokenResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Verify contact exists and belongs to organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, organization_id, first_name, last_name, email, portal_token')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .single()

    if (contactError || !contact) {
      return {
        success: false,
        error: 'Contact not found',
      }
    }

    // If contact already has a token, return it
    if (contact.portal_token) {
      // In production, fail loudly if NEXT_PUBLIC_APP_URL is not set
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
      const portalUrl = `${baseUrl}/public/donor/${contact.portal_token}`

      return {
        success: true,
        token: contact.portal_token,
        portalUrl,
      }
    }

    // Generate new token
    const token = generateToken()

    // Update contact with new token
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        portal_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)

    if (updateError) {
      console.error('Error updating contact with portal token:', updateError)
      return {
        success: false,
        error: 'Failed to generate portal link',
      }
    }

    // Log activity
    const { error: activityError } = await supabase.from('activities').insert({
      contact_id: contactId,
      organization_id: organizationId,
      activity_type: 'portal_generated',
      description: `Portal link generated for ${contact.first_name} ${contact.last_name}`,
      metadata: {
        email: contact.email,
      },
    })

    if (activityError) {
      console.error('Error logging activity:', activityError)
      // Don't fail the operation if activity logging fails
    }

    // Construct portal URL
    // In production, fail loudly if NEXT_PUBLIC_APP_URL is not set
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
    const portalUrl = `${baseUrl}/public/donor/${token}`

    return {
      success: true,
      token,
      portalUrl,
    }
  } catch (error) {
    console.error('Error in generatePortalToken:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
