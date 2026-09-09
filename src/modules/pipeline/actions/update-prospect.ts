'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prospectSchema } from '../schemas/pipeline.schema'
import { z } from 'zod'

// Schema for updating prospect details (all fields optional except prospect_id)
const updateProspectSchema = z.object({
  prospect_id: z.string().uuid(),
  target_ask_amount: z.number().positive().optional(),
  target_ask_date: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  readiness_score: z.number().min(0).max(100).optional(),
  predicted_gift_amount: z.number().positive().optional(),
  recommended_ask_amount: z.number().positive().optional(),
  optimal_ask_timing: z.string().optional(),
  next_move: z.string().optional(),
  next_move_date: z.string().optional(),
  actual_gift_amount: z.number().positive().optional(),
  notes: z.string().optional(),
})

export type UpdateProspectInput = z.infer<typeof updateProspectSchema>

export type UpdateProspectResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action to update prospect details
 * - Validates input with Zod schema
 * - Updates prospect fields (target_ask_amount, assigned_to, notes, etc.)
 * - Does NOT update stage (use moveStage action for that)
 * - Requires organization membership
 */
export async function updateProspect(
  input: UpdateProspectInput
): Promise<UpdateProspectResult> {
  try {
    // Validate input
    const validatedData = updateProspectSchema.parse(input)

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

    // Verify prospect belongs to this organization
    const { data: prospect, error: prospectError } = await supabase
      .from('major_gift_prospects')
      .select('id, contact_id')
      .eq('id', validatedData.prospect_id)
      .eq('organization_id', organizationId)
      .single()

    if (prospectError || !prospect) {
      return { success: false, error: 'Prospect not found' }
    }

    // Build update object with only provided fields
    const updateData: any = {}

    if (validatedData.target_ask_amount !== undefined) {
      updateData.target_ask_amount = validatedData.target_ask_amount
    }
    if (validatedData.target_ask_date !== undefined) {
      updateData.target_ask_date = validatedData.target_ask_date
    }
    if (validatedData.assigned_to !== undefined) {
      updateData.assigned_to = validatedData.assigned_to
    }
    if (validatedData.readiness_score !== undefined) {
      updateData.readiness_score = validatedData.readiness_score
    }
    if (validatedData.predicted_gift_amount !== undefined) {
      updateData.predicted_gift_amount = validatedData.predicted_gift_amount
    }
    if (validatedData.recommended_ask_amount !== undefined) {
      updateData.recommended_ask_amount = validatedData.recommended_ask_amount
    }
    if (validatedData.optimal_ask_timing !== undefined) {
      updateData.optimal_ask_timing = validatedData.optimal_ask_timing
    }
    if (validatedData.next_move !== undefined) {
      updateData.next_move = validatedData.next_move
    }
    if (validatedData.next_move_date !== undefined) {
      updateData.next_move_date = validatedData.next_move_date
    }
    if (validatedData.actual_gift_amount !== undefined) {
      updateData.actual_gift_amount = validatedData.actual_gift_amount
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return { success: true, id: validatedData.prospect_id }
    }

    // Update the prospect
    const { data: updatedProspect, error: updateError } = await supabase
      .from('major_gift_prospects')
      .update(updateData)
      .eq('id', validatedData.prospect_id)
      .eq('organization_id', organizationId)
      .select('id, contact_id')
      .single()

    if (updateError || !updatedProspect) {
      console.error('Supabase prospect update error:', updateError)
      return {
        success: false,
        error: updateError?.message || 'Failed to update prospect',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath(`/pipeline/${validatedData.prospect_id}`)
    revalidatePath(`/contacts/${updatedProspect.contact_id}`)
    revalidatePath('/')

    return { success: true, id: updatedProspect.id }
  } catch (error) {
    console.error('Error updating prospect:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to update prospect outcome
 * Convenience function for marking a prospect as won/lost/deferred
 */
export async function updateProspectOutcome(
  prospectId: string,
  outcome: 'pending' | 'won' | 'lost' | 'deferred',
  actualGiftAmount?: number
): Promise<UpdateProspectResult> {
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

    // Verify prospect belongs to this organization
    const { data: prospect, error: prospectError } = await supabase
      .from('major_gift_prospects')
      .select('id, contact_id')
      .eq('id', prospectId)
      .eq('organization_id', organizationId)
      .single()

    if (prospectError || !prospect) {
      return { success: false, error: 'Prospect not found' }
    }

    // Update outcome
    const updateData: any = { outcome }
    if (actualGiftAmount !== undefined && outcome === 'won') {
      updateData.actual_gift_amount = actualGiftAmount
    }

    const { data: updatedProspect, error: updateError } = await supabase
      .from('major_gift_prospects')
      .update(updateData)
      .eq('id', prospectId)
      .eq('organization_id', organizationId)
      .select('id, contact_id')
      .single()

    if (updateError || !updatedProspect) {
      console.error('Supabase prospect outcome update error:', updateError)
      return {
        success: false,
        error: updateError?.message || 'Failed to update prospect outcome',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath(`/pipeline/${prospectId}`)
    revalidatePath(`/contacts/${updatedProspect.contact_id}`)
    revalidatePath('/')

    return { success: true, id: updatedProspect.id }
  } catch (error) {
    console.error('Error updating prospect outcome:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
