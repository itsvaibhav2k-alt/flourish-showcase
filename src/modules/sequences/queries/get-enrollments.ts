/**
 * Get Enrollments Query
 *
 * Fetch enrollments for a sequence with contact information
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { EnrollmentWithContact } from '../schemas/sequence.schema'

export type GetEnrollmentsResult = {
  success: boolean
  enrollments?: EnrollmentWithContact[]
  total?: number
  error?: string
}

export type EnrollmentFilters = {
  status?: string
  limit?: number
  offset?: number
}

export async function getEnrollments(
  sequenceId: string,
  filters?: EnrollmentFilters
): Promise<GetEnrollmentsResult> {
  try {
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
      .eq('id', sequenceId)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Sequence not found' }
    }

    // Build query
    let query = supabase
      .from('sequence_enrollments')
      .select(
        `
        *,
        contact:contacts(id, first_name, last_name, email)
      `,
        { count: 'exact' }
      )
      .eq('sequence_id', sequenceId)

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Order by enrollment date
    query = query.order('enrolled_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching enrollments:', error)
      return { success: false, error: 'Failed to fetch enrollments' }
    }

    return {
      success: true,
      enrollments: data as EnrollmentWithContact[],
      total: count || 0,
    }
  } catch (error) {
    console.error('Get enrollments error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch enrollments',
    }
  }
}
