/**
 * Get Sequences Query
 *
 * Fetch all sequences for the current organization
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Sequence } from '../schemas/sequence.schema'

export type GetSequencesResult = {
  success: boolean
  sequences?: Sequence[]
  error?: string
}

export async function getSequences(): Promise<GetSequencesResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Fetch sequences
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_template', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sequences:', error)
      return { success: false, error: 'Failed to fetch sequences' }
    }

    return {
      success: true,
      sequences: data as Sequence[],
    }
  } catch (error) {
    console.error('Get sequences error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sequences',
    }
  }
}
