'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addProspectSchema, type AddProspectInput } from '../schemas/pipeline.schema'

export type AddProspectResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action to add a contact to the major gift pipeline
 * - Validates input with Zod schema
 * - Creates a new prospect record
 * - Sets initial stage (default: identification)
 * - Requires organization membership
 * - Prevents duplicates (one contact can only be a prospect once)
 */
export async function addProspect(
  input: AddProspectInput
): Promise<AddProspectResult> {
  try {
    // Validate input
    const validatedData = addProspectSchema.parse(input)

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

    // Check if contact is already in pipeline
    const { data: existingProspect, error: checkError } = await supabase
      .from('major_gift_prospects')
      .select('id')
      .eq('contact_id', validatedData.contact_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking for existing prospect:', checkError)
      return { success: false, error: 'Failed to check for existing prospect' }
    }

    if (existingProspect) {
      return { success: false, error: 'Contact is already in the pipeline' }
    }

    // Insert new prospect
    const { data: prospect, error: insertError } = await supabase
      .from('major_gift_prospects')
      .insert({
        contact_id: validatedData.contact_id,
        organization_id: organizationId,
        stage: validatedData.stage,
        stage_entered_at: new Date().toISOString(),
        target_ask_amount: validatedData.target_ask_amount ?? null,
        target_ask_date: validatedData.target_ask_date ?? null,
        assigned_to: validatedData.assigned_to ?? null,
        notes: validatedData.notes ?? null,
        outcome: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !prospect) {
      console.error('Supabase major_gift_prospects insert error:', insertError)
      return {
        success: false,
        error: insertError?.message || 'Failed to add prospect to pipeline',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath(`/contacts/${validatedData.contact_id}`)
    revalidatePath('/')

    return { success: true, id: prospect.id }
  } catch (error) {
    console.error('Error adding prospect:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to remove a contact from the pipeline
 */
export async function removeProspect(prospectId: string): Promise<AddProspectResult> {
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

    // Delete the prospect record
    const { error: deleteError } = await supabase
      .from('major_gift_prospects')
      .delete()
      .eq('id', prospectId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error removing prospect:', deleteError)
      return { success: false, error: 'Failed to remove prospect from pipeline' }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath('/')

    return { success: true, id: prospectId }
  } catch (error) {
    console.error('Error in removeProspect:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
