/**
 * Save Sequence Action
 *
 * Server action to save a complete email sequence with its steps.
 * Handles create, update, and delete operations for both the sequence
 * and its associated steps in a single transaction-like operation.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { SaveSequenceSchema, type SaveSequenceInput } from '../schemas/sequence.schema'
import type { Json } from '@/lib/supabase/types'

export type SaveSequenceResult = {
  success: boolean
  sequenceId?: string
  error?: string
}

/**
 * Save a sequence with all its steps
 *
 * - Creates new sequence or updates existing one
 * - Handles step creation, updates, and deletions
 * - Steps are ordered based on their position in the array
 */
export async function saveSequence(
  input: SaveSequenceInput
): Promise<SaveSequenceResult> {
  try {
    // Validate input
    const validatedInput = SaveSequenceSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const isUpdate = !!validatedInput.id
    let sequenceId: string

    if (isUpdate && validatedInput.id) {
      // Verify sequence belongs to organization
      const { data: existingSequence, error: fetchError } = await supabase
        .from('email_sequences')
        .select('id')
        .eq('id', validatedInput.id)
        .eq('organization_id', organizationId)
        .single()

      if (fetchError || !existingSequence) {
        return { success: false, error: 'Sequence not found' }
      }

      // Update sequence
      const { error: updateError } = await supabase
        .from('email_sequences')
        .update({
          name: validatedInput.name,
          description: validatedInput.description || null,
          trigger_type: validatedInput.trigger_type,
          trigger_config: (validatedInput.trigger_config || {}) as Json,
          is_active: validatedInput.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validatedInput.id)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Error updating sequence:', updateError)
        return { success: false, error: 'Failed to update sequence' }
      }

      sequenceId = validatedInput.id
    } else {
      // Create new sequence
      const { data: newSequence, error: createError } = await supabase
        .from('email_sequences')
        .insert({
          organization_id: organizationId,
          created_by: user.id,
          name: validatedInput.name,
          description: validatedInput.description || null,
          trigger_type: validatedInput.trigger_type,
          trigger_config: (validatedInput.trigger_config || {}) as Json,
          is_active: validatedInput.is_active,
        })
        .select('id')
        .single()

      if (createError || !newSequence) {
        console.error('Error creating sequence:', createError)
        return { success: false, error: 'Failed to create sequence' }
      }

      sequenceId = newSequence.id
    }

    // Handle steps - delete removed steps if updating
    if (isUpdate && validatedInput.id) {
      // Get existing steps to determine what to delete
      const { data: existingSteps, error: stepsError } = await supabase
        .from('email_sequence_steps')
        .select('id')
        .eq('sequence_id', sequenceId)

      if (stepsError) {
        console.error('Error fetching existing steps:', stepsError)
        return { success: false, error: 'Failed to fetch existing steps' }
      }

      const existingStepIds = new Set(existingSteps?.map(s => s.id) || [])
      const inputStepIds = new Set(
        validatedInput.steps.filter(s => s.id).map(s => s.id as string)
      )

      // Delete steps that are no longer in the input
      const stepsToDelete = [...existingStepIds].filter(id => !inputStepIds.has(id))

      if (stepsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('email_sequence_steps')
          .delete()
          .in('id', stepsToDelete)

        if (deleteError) {
          console.error('Error deleting steps:', deleteError)
          return { success: false, error: 'Failed to delete old steps' }
        }
      }
    }

    // Upsert all steps with correct order
    for (let i = 0; i < validatedInput.steps.length; i++) {
      const step = validatedInput.steps[i]
      const stepOrder = i + 1 // 1-indexed step order

      if (step.id) {
        // Update existing step
        const { error: updateStepError } = await supabase
          .from('email_sequence_steps')
          .update({
            name: step.name,
            step_order: stepOrder,
            delay_days: step.delay_days,
            delay_hours: step.delay_hours,
            template_type: step.template_type,
            subject_template: step.subject_template || null,
            custom_instructions: step.custom_instructions || null,
            conditions: (step.conditions || {}) as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', step.id)
          .eq('sequence_id', sequenceId)

        if (updateStepError) {
          console.error('Error updating step:', updateStepError)
          return { success: false, error: `Failed to update step "${step.name}"` }
        }
      } else {
        // Create new step
        const { error: createStepError } = await supabase
          .from('email_sequence_steps')
          .insert({
            sequence_id: sequenceId,
            name: step.name,
            step_order: stepOrder,
            delay_days: step.delay_days,
            delay_hours: step.delay_hours,
            template_type: step.template_type,
            subject_template: step.subject_template || null,
            custom_instructions: step.custom_instructions || null,
            conditions: (step.conditions || {}) as Json,
          })

        if (createStepError) {
          console.error('Error creating step:', createStepError)
          return { success: false, error: `Failed to create step "${step.name}"` }
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath('/sequences')
    revalidatePath(`/sequences/${sequenceId}`)

    return {
      success: true,
      sequenceId,
    }
  } catch (error) {
    console.error('Save sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save sequence',
    }
  }
}
