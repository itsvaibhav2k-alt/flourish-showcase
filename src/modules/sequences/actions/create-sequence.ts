/**
 * Create Sequence Action
 *
 * Server action to create a new email sequence
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { CreateSequenceSchema, type CreateSequenceInput } from '../schemas/sequence.schema'

export type CreateSequenceResult = {
  success: boolean
  sequenceId?: string
  error?: string
}

export async function createSequence(
  input: CreateSequenceInput
): Promise<CreateSequenceResult> {
  try {
    // Validate input
    const validatedInput = CreateSequenceSchema.parse(input)

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

    // Create sequence
    const { data, error } = await supabase
      .from('email_sequences')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        ...validatedInput,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating sequence:', error)
      return { success: false, error: 'Failed to create sequence' }
    }

    return {
      success: true,
      sequenceId: data.id,
    }
  } catch (error) {
    console.error('Create sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sequence',
    }
  }
}
