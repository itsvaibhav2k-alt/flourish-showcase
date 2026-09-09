'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createGivingPotentialSchema,
  type CreateGivingPotentialInput,
} from '../schemas/giving-potential.schema'

export type SaveGivingPotentialResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action to create or update giving potential record
 * - Validates input with Zod schema
 * - Uses upsert on contact_id to avoid duplicates
 * - Requires organization membership
 * - Revalidates relevant paths
 */
export async function saveGivingPotential(
  input: CreateGivingPotentialInput
): Promise<SaveGivingPotentialResult> {
  try {
    // Validate input
    const validatedData = createGivingPotentialSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedData.contact_id)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Upsert giving potential record (update if exists, insert if not)
    const { data: givingPotential, error: upsertError } = await supabase
      .from('giving_potential')
      .upsert(
        {
          contact_id: validatedData.contact_id,
          organization_id: organizationId,
          estimated_net_worth: validatedData.estimated_net_worth ?? null,
          real_estate_value: validatedData.real_estate_value ?? null,
          stock_holdings: validatedData.stock_holdings ?? null,
          political_donations: validatedData.political_donations ?? null,
          nonprofit_board_count: validatedData.nonprofit_board_count ?? 0,
          employer: validatedData.employer ?? null,
          job_title: validatedData.job_title ?? null,
          capacity_score: validatedData.capacity_score ?? null,
          affinity_score: validatedData.affinity_score ?? null,
          propensity_score: validatedData.propensity_score ?? null,
          overall_score: validatedData.overall_score ?? null,
          giving_gap_ratio: validatedData.giving_gap_ratio ?? null,
          data_sources: validatedData.data_sources ?? {},
          notes: validatedData.notes ?? null,
          last_enriched_at: validatedData.last_enriched_at ?? null,
        },
        {
          onConflict: 'contact_id',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single()

    if (upsertError || !givingPotential) {
      console.error('Supabase giving_potential upsert error:', upsertError)
      return {
        success: false,
        error: upsertError?.message || 'Failed to save giving potential',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/prospects')
    revalidatePath(`/contacts/${validatedData.contact_id}`)
    revalidatePath('/')

    return { success: true, id: givingPotential.id }
  } catch (error) {
    console.error('Error saving giving potential:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to delete giving potential record
 */
export async function deleteGivingPotential(
  contactId: string
): Promise<SaveGivingPotentialResult> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Delete the giving potential record
    const { error: deleteError } = await supabase
      .from('giving_potential')
      .delete()
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting giving potential:', deleteError)
      return { success: false, error: 'Failed to delete giving potential' }
    }

    // Revalidate relevant paths
    revalidatePath('/prospects')
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath('/')

    return { success: true, id: contactId }
  } catch (error) {
    console.error('Error in deleteGivingPotential:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
