/**
 * Manage Sequence Steps Actions
 *
 * Server actions to add, update, and delete sequence steps
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import {
  CreateStepSchema,
  UpdateStepSchema,
  type CreateStepInput,
  type UpdateStepInput,
} from '../schemas/sequence.schema'

export type StepActionResult = {
  success: boolean
  stepId?: string
  error?: string
}

/**
 * Add a step to a sequence
 */
export async function addStep(input: CreateStepInput): Promise<StepActionResult> {
  try {
    // Validate input
    const validatedInput = CreateStepSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Verify sequence belongs to organization
    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('id', validatedInput.sequence_id)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Sequence not found' }
    }

    // Create step
    const { data, error } = await supabase
      .from('email_sequence_steps')
      .insert(validatedInput)
      .select('id')
      .single()

    if (error) {
      console.error('Error adding step:', error)
      return { success: false, error: 'Failed to add step' }
    }

    return {
      success: true,
      stepId: data.id,
    }
  } catch (error) {
    console.error('Add step error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add step',
    }
  }
}

/**
 * Update a sequence step
 */
export async function updateStep(
  stepId: string,
  input: UpdateStepInput
): Promise<StepActionResult> {
  try {
    // Validate input
    const validatedInput = UpdateStepSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Verify step belongs to organization's sequence
    const { data: step, error: stepError } = await supabase
      .from('email_sequence_steps')
      .select('sequence_id')
      .eq('id', stepId)
      .single()

    if (stepError || !step) {
      return { success: false, error: 'Step not found' }
    }

    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('id', step.sequence_id)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Access denied' }
    }

    // Update step
    const { error } = await supabase
      .from('email_sequence_steps')
      .update({
        ...validatedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stepId)

    if (error) {
      console.error('Error updating step:', error)
      return { success: false, error: 'Failed to update step' }
    }

    return { success: true }
  } catch (error) {
    console.error('Update step error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update step',
    }
  }
}

/**
 * Delete a sequence step
 */
export async function deleteStep(stepId: string): Promise<StepActionResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Verify step belongs to organization's sequence
    const { data: step, error: stepError } = await supabase
      .from('email_sequence_steps')
      .select('sequence_id')
      .eq('id', stepId)
      .single()

    if (stepError || !step) {
      return { success: false, error: 'Step not found' }
    }

    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('id', step.sequence_id)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Access denied' }
    }

    // Delete step
    const { error } = await supabase
      .from('email_sequence_steps')
      .delete()
      .eq('id', stepId)

    if (error) {
      console.error('Error deleting step:', error)
      return { success: false, error: 'Failed to delete step' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete step error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete step',
    }
  }
}
