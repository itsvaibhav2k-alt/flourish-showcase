'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { createDonationFormSchema, type CreateDonationFormInput } from '../schemas/donation.schema'

type ActionResult = {
  success: boolean
  data?: { id: string; slug: string }
  error?: string
}

/**
 * Server action to create a new donation form
 */
export async function createDonationForm(input: CreateDonationFormInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = createDonationFormSchema.parse(input)

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

    // Check if slug is unique for this organization
    const { data: existingForm } = await supabase
      .from('donation_forms')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('slug', validatedData.slug)
      .single()

    if (existingForm) {
      return {
        success: false,
        error: 'A donation form with this slug already exists',
      }
    }

    // Insert donation form
    const { data, error } = await supabase
      .from('donation_forms')
      .insert({
        organization_id: organizationId,
        name: validatedData.name,
        slug: validatedData.slug,
        title: validatedData.title,
        description: validatedData.description || null,
        preset_amounts: validatedData.preset_amounts,
        allow_custom_amount: validatedData.allow_custom_amount,
        min_amount: validatedData.min_amount,
        max_amount: validatedData.max_amount || null,
        allow_recurring: validatedData.allow_recurring,
        default_frequency: validatedData.default_frequency,
        campaign: validatedData.campaign || null,
        collect_donor_info: validatedData.collect_donor_info,
        require_email: validatedData.require_email,
        require_phone: validatedData.require_phone,
        require_address: validatedData.require_address,
        custom_fields: validatedData.custom_fields,
        thank_you_message: validatedData.thank_you_message || null,
        redirect_url: validatedData.redirect_url || null,
        is_active: validatedData.is_active,
      })
      .select('id, slug')
      .single()

    if (error) {
      console.error('Error creating donation form:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate paths
    revalidatePath('/donations/forms')
    revalidatePath('/settings')

    return {
      success: true,
      data: { id: data.id, slug: data.slug },
    }
  } catch (error) {
    console.error('Error in createDonationForm:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create donation form',
    }
  }
}
