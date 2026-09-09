/**
 * Get Sequence Stats Query
 *
 * Fetch statistics for sequences
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { SequenceStats } from '../schemas/sequence.schema'

export type GetSequenceStatsResult = {
  success: boolean
  stats?: SequenceStats[]
  error?: string
}

export async function getSequenceStats(): Promise<GetSequenceStatsResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get all sequences for the org
    const { data: sequences, error: seqError } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_template', false)

    if (seqError) {
      console.error('Error fetching sequences:', seqError)
      return { success: false, error: 'Failed to fetch sequence stats' }
    }

    if (!sequences || sequences.length === 0) {
      return { success: true, stats: [] }
    }

    // Get stats for each sequence
    const stats = await Promise.all(
      sequences.map(async (seq) => {
        // Count enrollments
        const { count: totalEnrolled } = await supabase
          .from('sequence_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id)

        const { count: activeEnrolled } = await supabase
          .from('sequence_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id)
          .eq('status', 'active')

        const { count: completed } = await supabase
          .from('sequence_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('sequence_id', seq.id)
          .eq('status', 'completed')

        // Count sent emails from step executions
        const { count: totalSent } = await supabase
          .from('sequence_step_executions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .in(
            'enrollment_id',
            supabase
              .from('sequence_enrollments')
              .select('id')
              .eq('sequence_id', seq.id)
          )

        return {
          sequence_id: seq.id,
          total_enrolled: totalEnrolled || 0,
          active_enrolled: activeEnrolled || 0,
          completed: completed || 0,
          total_sent: totalSent || 0,
          avg_open_rate: 0, // TODO: Calculate from email_drafts stats when tracking is implemented
        }
      })
    )

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('Get sequence stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sequence stats',
    }
  }
}
