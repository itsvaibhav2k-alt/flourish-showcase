'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

// Schema for updating donor info via portal
const updateDonorInfoSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
})

export type UpdateDonorInfoInput = z.infer<typeof updateDonorInfoSchema>

export interface UpdateDonorInfoResult {
  success: boolean
  error?: string
}

/**
 * Updates donor contact information via the self-service portal.
 * Uses admin client to bypass RLS since this is a public portal.
 * Logs the update as an activity.
 *
 * @param token - The secure portal token
 * @param data - The fields to update
 * @returns Success status and optional error message
 */
export async function updateDonorInfo(
  token: string,
  data: UpdateDonorInfoInput
): Promise<UpdateDonorInfoResult> {
  try {
    // Validate input
    const validatedData = updateDonorInfoSchema.parse(data)

    const supabase = createAdminClient()

    // First, verify the token exists and get the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, organization_id, first_name, last_name')
      .eq('portal_token', token)
      .is('archived_at', null)
      .single()

    if (contactError || !contact) {
      return {
        success: false,
        error: 'Invalid or expired portal link',
      }
    }

    // Update contact record
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id)

    if (updateError) {
      console.error('Error updating contact:', updateError)
      return {
        success: false,
        error: 'Failed to update information. Please try again.',
      }
    }

    // Log activity
    const { error: activityError } = await supabase.from('activities').insert({
      contact_id: contact.id,
      organization_id: contact.organization_id,
      activity_type: 'portal_update',
      description: `${contact.first_name} ${contact.last_name} updated their contact information via the donor portal`,
      metadata: {
        updated_fields: Object.keys(validatedData),
      },
    })

    if (activityError) {
      console.error('Error logging activity:', activityError)
      // Don't fail the update if activity logging fails
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateDonorInfo:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid data provided. Please check your inputs.',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
