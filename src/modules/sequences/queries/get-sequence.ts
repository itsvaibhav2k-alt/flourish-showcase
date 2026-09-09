/**
 * Get Sequence Query
 *
 * Fetch a single sequence with its steps
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { SequenceWithSteps } from '../schemas/sequence.schema'

export type GetSequenceResult = {
  success: boolean
  sequence?: SequenceWithSteps
  error?: string
}

export async function getSequence(sequenceId: string): Promise<GetSequenceResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Fetch sequence with steps
    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', sequenceId)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Sequence not found' }
    }

    // Fetch steps
    const { data: steps, error: stepsError } = await supabase
      .from('email_sequence_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('step_order', { ascending: true })

    if (stepsError) {
      console.error('Error fetching steps:', stepsError)
      return { success: false, error: 'Failed to fetch sequence steps' }
    }

    return {
      success: true,
      sequence: {
        ...sequence,
        steps: steps || [],
      } as SequenceWithSteps,
    }
  } catch (error) {
    console.error('Get sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sequence',
    }
  }
}
