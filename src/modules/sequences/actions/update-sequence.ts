/**
 * Update Sequence Action
 *
 * Server action to update an existing email sequence
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { UpdateSequenceSchema, type UpdateSequenceInput } from '../schemas/sequence.schema'

export type UpdateSequenceResult = {
  success: boolean
  error?: string
}

export async function updateSequence(
  sequenceId: string,
  input: UpdateSequenceInput
): Promise<UpdateSequenceResult> {
  try {
    // Validate input
    const validatedInput = UpdateSequenceSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update sequence
    const { error } = await supabase
      .from('email_sequences')
      .update({
        ...validatedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sequenceId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating sequence:', error)
      return { success: false, error: 'Failed to update sequence' }
    }

    return { success: true }
  } catch (error) {
    console.error('Update sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sequence',
    }
  }
}
