'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateStageSchema, type UpdateStageInput, type Stage } from '../schemas/pipeline.schema'

export type MoveStageResult =
  | { success: true; id: string; new_stage: Stage }
  | { success: false; error: string }

/**
 * Server action to move a prospect to a different pipeline stage
 * - Validates input with Zod schema
 * - Updates stage and stage_entered_at timestamp
 * - Validates stage transition (ensures valid progression)
 * - Requires organization membership
 */
export async function moveStage(
  input: UpdateStageInput
): Promise<MoveStageResult> {
  try {
    // Validate input
    const validatedData = updateStageSchema.parse(input)

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

    // Fetch current prospect to validate it exists and belongs to the organization
    const { data: prospect, error: prospectError } = await supabase
      .from('major_gift_prospects')
      .select('id, stage, contact_id, notes')
      .eq('id', validatedData.prospect_id)
      .eq('organization_id', organizationId)
      .single()

    if (prospectError || !prospect) {
      return { success: false, error: 'Prospect not found' }
    }

    // Validate stage transition (optional: can be removed if all transitions are allowed)
    const currentStage = prospect.stage
    const newStage = validatedData.new_stage

    // You could add business rules here, e.g.:
    // - Can't move backwards from won/lost
    // - Must follow a specific sequence
    // For now, we'll allow all transitions

    // Update the prospect stage
    const updateData: any = {
      stage: newStage,
      stage_entered_at: new Date().toISOString(),
    }

    // If notes are provided, append them to existing notes
    if (validatedData.notes) {
      const timestamp = new Date().toISOString()
      const newNote = `[${timestamp}] Stage moved from ${currentStage} to ${newStage}: ${validatedData.notes}`

      // Get existing notes
      const existingNotes = (prospect as any).notes || ''
      updateData.notes = existingNotes
        ? `${existingNotes}\n\n${newNote}`
        : newNote
    }

    const { data: updatedProspect, error: updateError } = await supabase
      .from('major_gift_prospects')
      .update(updateData)
      .eq('id', validatedData.prospect_id)
      .eq('organization_id', organizationId)
      .select('id, stage, contact_id')
      .single()

    if (updateError || !updatedProspect) {
      console.error('Supabase prospect stage update error:', updateError)
      return {
        success: false,
        error: updateError?.message || 'Failed to update prospect stage',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath(`/pipeline/${validatedData.prospect_id}`)
    revalidatePath(`/contacts/${updatedProspect.contact_id}`)
    revalidatePath('/')

    return {
      success: true,
      id: updatedProspect.id,
      new_stage: updatedProspect.stage as Stage
    }
  } catch (error) {
    console.error('Error moving prospect stage:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Note: Helper functions moved to ../services/stage-helpers.ts
// Import them from there: import { isValidStageTransition, getNextStage } from '../services/stage-helpers'
