'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { updateDonationFormSchema, type UpdateDonationFormInput } from '../schemas/donation.schema'

type ActionResult = {
  success: boolean
  data?: { id: string }
  error?: string
}

/**
 * Server action to update an existing donation form
 */
export async function updateDonationForm(
  formId: string,
  input: UpdateDonationFormInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = updateDonationFormSchema.parse(input)

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

    // If slug is being updated, check for uniqueness
    if (validatedData.slug) {
      const { data: existingForm } = await supabase
        .from('donation_forms')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('slug', validatedData.slug)
        .neq('id', formId)
        .single()

      if (existingForm) {
        return {
          success: false,
          error: 'A donation form with this slug already exists',
        }
      }
    }

    // Update donation form
    const { data, error } = await supabase
      .from('donation_forms')
      .update(validatedData)
      .eq('id', formId)
      .eq('organization_id', organizationId)
      .select('id')
      .single()

    if (error) {
      console.error('Error updating donation form:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Donation form not found',
      }
    }

    // Revalidate paths
    revalidatePath('/donations/forms')
    revalidatePath(`/donations/forms/${formId}`)
    revalidatePath('/settings')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in updateDonationForm:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update donation form',
    }
  }
}
