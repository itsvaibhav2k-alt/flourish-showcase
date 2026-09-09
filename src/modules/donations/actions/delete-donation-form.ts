'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Server action to delete a donation form
 * Note: This performs a soft delete by setting is_active to false
 */
export async function deleteDonationForm(formId: string): Promise<ActionResult> {
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

    // Check if form has associated donations
    const { data: donations, error: checkError } = await supabase
      .from('donations')
      .select('id')
      .eq('donation_form_id', formId)
      .limit(1)

    if (checkError) {
      console.error('Error checking donations:', checkError)
      return {
        success: false,
        error: checkError.message,
      }
    }

    // If form has donations, only deactivate it
    if (donations && donations.length > 0) {
      const { error: updateError } = await supabase
        .from('donation_forms')
        .update({ is_active: false })
        .eq('id', formId)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Error deactivating donation form:', updateError)
        return {
          success: false,
          error: updateError.message,
        }
      }
    } else {
      // If no donations, perform hard delete
      const { error: deleteError } = await supabase
        .from('donation_forms')
        .delete()
        .eq('id', formId)
        .eq('organization_id', organizationId)

      if (deleteError) {
        console.error('Error deleting donation form:', deleteError)
        return {
          success: false,
          error: deleteError.message,
        }
      }
    }

    // Revalidate paths
    revalidatePath('/donations/forms')
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteDonationForm:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete donation form',
    }
  }
}
