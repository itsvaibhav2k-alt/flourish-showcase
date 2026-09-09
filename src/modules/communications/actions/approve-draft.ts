/**
 * Approve Draft Action
 *
 * Server action to approve or reject email drafts.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ApproveDraftParams {
  draftId: string
  approved: boolean
  rejectionReason?: string
  editedSubject?: string
  editedBody?: string
  autoSend?: boolean // If true, automatically send the email after approval
  sendParams?: {
    fromName?: string
    fromEmail?: string
    replyTo?: string
  }
}

export interface ApproveDraftResult {
  success: boolean
  error?: string
  status?: 'approved' | 'rejected' | 'sent'
  emailSent?: boolean
  emailId?: string
}

/**
 * Approve or reject an email draft
 */
export async function approveDraft(
  params: ApproveDraftParams
): Promise<ApproveDraftResult> {
  try {
    const {
      draftId,
      approved,
      rejectionReason,
      editedSubject,
      editedBody,
      autoSend,
      sendParams,
    } = params

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

    // Check if draft is already processed (accept 'draft' or 'pending' status)
    if (!['draft', 'pending'].includes(draft.status)) {
      return {
        success: false,
        error: `Draft is already ${draft.status}`,
      }
    }

    // Prepare update data
    const updateData: any = {
      status: approved ? 'approved' : 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Add rejection reason if rejected
    if (!approved && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    // Apply edits if provided
    if (editedSubject && editedSubject !== draft.subject) {
      updateData.subject = editedSubject
      updateData.was_edited = true
    }

    if (editedBody && editedBody !== draft.body) {
      updateData.body = editedBody
      updateData.was_edited = true
    }

    // Update draft
    const { error: updateError } = await supabase
      .from('email_drafts')
      .update(updateData)
      .eq('id', draftId)

    if (updateError) {
      console.error('Failed to update draft:', updateError)
      return { success: false, error: 'Failed to update draft' }
    }

    // Revalidate relevant paths
    revalidatePath('/communications')
    revalidatePath(`/communications/drafts/${draftId}`)

    // If approved and autoSend is true, send the email immediately
    if (approved && autoSend) {
      const { sendEmail } = await import('./send-email')

      const sendResult = await sendEmail({
        draftId,
        fromName: sendParams?.fromName,
        fromEmail: sendParams?.fromEmail,
        replyTo: sendParams?.replyTo,
      })

      if (sendResult.success) {
        return {
          success: true,
          status: 'sent',
          emailSent: true,
          emailId: sendResult.emailId,
        }
      } else {
        // Email failed to send, but draft was approved
        // Return success but indicate email wasn't sent
        return {
          success: true,
          status: 'approved',
          emailSent: false,
          error: `Draft approved but email failed to send: ${sendResult.error}`,
        }
      }
    }

    return {
      success: true,
      status: approved ? 'approved' : 'rejected',
      emailSent: false,
    }
  } catch (error) {
    console.error('Approve draft error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process draft. Please try again.',
    }
  }
}

/**
 * Get draft by ID
 */
export async function getDraft(draftId: string) {
  const supabase = await createClient()

  // Verify user has access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: draft, error } = await supabase
    .from('email_drafts')
    .select(
      `
      *,
      contacts(first_name, last_name, email),
      organizations(name)
    `
    )
    .eq('id', draftId)
    .single()

  if (error || !draft) {
    return null
  }

  // Verify user is member of organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', draft.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return null
  }

  return draft
}

/**
 * Get pending drafts for an organization
 */
export async function getPendingDrafts(organizationId: string) {
  const supabase = await createClient()

  // Verify user has access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  // Verify user is member of organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return []
  }

  const { data: drafts, error } = await supabase
    .from('email_drafts')
    .select(
      `
      id,
      email_type,
      subject,
      status,
      created_at,
      contacts(first_name, last_name, email)
    `
    )
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to fetch drafts:', error)
    return []
  }

  return drafts || []
}

/**
 * Get draft statistics for an organization
 */
export async function getDraftStats(organizationId: string) {
  const supabase = await createClient()

  // Verify user has access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Verify user is member of organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return null
  }

  // Get counts by status
  const { data: drafts, error } = await supabase
    .from('email_drafts')
    .select('status, email_type')
    .eq('organization_id', organizationId)

  if (error) {
    return null
  }

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    sent: 0,
    total: drafts?.length || 0,
    byType: {
      thank_you: 0,
      reengagement: 0,
      volunteer_confirmation: 0,
      volunteer_reminder: 0,
      volunteer_thank_you: 0,
    },
  }

  drafts?.forEach(draft => {
    // Count by status
    if (draft.status === 'pending') stats.pending++
    else if (draft.status === 'approved') stats.approved++
    else if (draft.status === 'rejected') stats.rejected++
    else if (draft.status === 'sent') stats.sent++

    // Count by type
    if (draft.email_type && draft.email_type in stats.byType) {
      stats.byType[draft.email_type as keyof typeof stats.byType]++
    }
  })

  return stats
}

/**
 * Approve and optionally send multiple drafts in batch
 */
export async function approveBatchDrafts(params: {
  draftIds: string[]
  autoSend?: boolean
  sendParams?: {
    fromName?: string
    fromEmail?: string
    replyTo?: string
  }
}): Promise<{
  success: boolean
  results: Array<{
    draftId: string
    success: boolean
    status?: 'approved' | 'sent' | 'rejected'
    error?: string
  }>
  successCount: number
  failureCount: number
}> {
  const results = await Promise.all(
    params.draftIds.map(async draftId => {
      const result = await approveDraft({
        draftId,
        approved: true,
        autoSend: params.autoSend,
        sendParams: params.sendParams,
      })

      return {
        draftId,
        success: result.success,
        status: result.status,
        error: result.error,
      }
    })
  )

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return {
    success: failureCount === 0,
    results,
    successCount,
    failureCount,
  }
}

/**
 * Delete a draft (only if pending or rejected)
 */
export async function deleteDraft(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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
      .select('status, organization_id')
      .eq('id', draftId)
      .single()

    if (draftError || !draft) {
      return { success: false, error: 'Draft not found' }
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', draft.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return { success: false, error: 'Access denied' }
    }

    // Only allow deletion of pending or rejected drafts
    if (!['pending', 'rejected'].includes(draft.status)) {
      return {
        success: false,
        error: 'Cannot delete approved or sent drafts',
      }
    }

    // Delete draft
    const { error: deleteError } = await supabase
      .from('email_drafts')
      .delete()
      .eq('id', draftId)

    if (deleteError) {
      return { success: false, error: 'Failed to delete draft' }
    }

    revalidatePath('/communications')

    return { success: true }
  } catch (error) {
    console.error('Delete draft error:', error)
    return { success: false, error: 'Failed to delete draft' }
  }
}
