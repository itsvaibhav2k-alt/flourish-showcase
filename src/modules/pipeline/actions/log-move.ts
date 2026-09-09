'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cultivationMoveSchema, type CultivationMoveInput } from '../schemas/pipeline.schema'

export type LogMoveResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action to log a cultivation move for a prospect
 * - Validates input with Zod schema
 * - Creates a cultivation_moves record
 * - Tracks who logged the move
 * - Updates prospect's next_move fields if provided
 * - Requires organization membership
 */
export async function logMove(
  input: CultivationMoveInput
): Promise<LogMoveResult> {
  try {
    // Validate input
    const validatedData = cultivationMoveSchema.parse(input)

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

    // Insert cultivation move
    const { data: move, error: insertError } = await supabase
      .from('cultivation_moves')
      .insert({
        prospect_id: validatedData.prospect_id,
        organization_id: organizationId,
        move_type: validatedData.move_type,
        move_date: validatedData.move_date,
        description: validatedData.description || null,
        outcome: validatedData.outcome || null,
        next_step: validatedData.next_step || null,
        logged_by: user.id,
      })
      .select('id')
      .single()

    if (insertError || !move) {
      console.error('Supabase cultivation_moves insert error:', insertError)
      return {
        success: false,
        error: insertError?.message || 'Failed to log cultivation move',
      }
    }

    // Update prospect's next_move fields if next_step was provided
    if (validatedData.next_step) {
      await supabase
        .from('major_gift_prospects')
        .update({
          next_move: validatedData.next_step,
          // Clear next_move_date for now - could be set separately
        })
        .eq('id', validatedData.prospect_id)
        .eq('organization_id', organizationId)
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath(`/pipeline/${validatedData.prospect_id}`)
    revalidatePath(`/contacts/${prospect.contact_id}`)
    revalidatePath('/')

    return { success: true, id: move.id }
  } catch (error) {
    console.error('Error logging cultivation move:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to delete a cultivation move
 */
export async function deleteMove(moveId: string): Promise<LogMoveResult> {
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

    // Delete the move record
    const { error: deleteError } = await supabase
      .from('cultivation_moves')
      .delete()
      .eq('id', moveId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting cultivation move:', deleteError)
      return { success: false, error: 'Failed to delete cultivation move' }
    }

    // Revalidate relevant paths
    revalidatePath('/pipeline')
    revalidatePath('/')

    return { success: true, id: moveId }
  } catch (error) {
    console.error('Error in deleteMove:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
