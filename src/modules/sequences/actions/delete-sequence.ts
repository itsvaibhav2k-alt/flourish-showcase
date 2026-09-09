/**
 * Delete Sequence Action
 *
 * Server action to delete an email sequence (will cascade delete steps and enrollments)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export type DeleteSequenceResult = {
  success: boolean
  error?: string
}

export async function deleteSequence(
  sequenceId: string
): Promise<DeleteSequenceResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Delete sequence (will cascade)
    const { error } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', sequenceId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting sequence:', error)
      return { success: false, error: 'Failed to delete sequence' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sequence',
    }
  }
}
