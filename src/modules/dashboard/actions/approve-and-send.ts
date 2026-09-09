'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ApproveAndSendResult {
  success: boolean
  error?: string
}

/**
 * Approve and send a draft email immediately
 */
export async function approveAndSend(draftId: string): Promise<ApproveAndSendResult> {
  try {
    if (!draftId) {
      return { success: false, error: 'Draft ID is required' }
    }

    const supabase = await createClient()

    // Verify user has access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get draft and verify access
    const { data: draft, error: draftError } = await supabase
      .from('email_drafts')
      .select('*, organizations!inner(id)')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      return { success: false, error: 'Draft not found' }
    }

    // Verify user is member of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', draft.organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return { success: false, error: 'Access denied to this draft' }
    }

    // Check if draft is in a reviewable status (draft or pending)
    if (!['draft', 'pending'].includes(draft.status)) {
      return {
        success: false,
        error: `Draft is already ${draft.status}`,
      }
    }

    // Update draft to approved status
    const { error: updateError } = await supabase
      .from('email_drafts')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    if (updateError) {
      console.error('Failed to approve draft:', updateError)
      return { success: false, error: 'Failed to approve draft' }
    }

    // Import and call the send email function
    const { sendEmail } = await import('@/modules/communications/actions/send-email')

    const sendResult = await sendEmail({
      draftId,
    })

    if (!sendResult.success) {
      // If send failed, revert status back to pending
      await supabase
        .from('email_drafts')
        .update({
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq('id', draftId)

      return {
        success: false,
        error: `Failed to send email: ${sendResult.error}`,
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/communications')

    return { success: true }
  } catch (error) {
    console.error('Approve and send error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to approve and send. Please try again.',
    }
  }
}
