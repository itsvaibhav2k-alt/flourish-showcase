'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import { generateDraft, type EmailType } from './generate-draft'

/**
 * Update draft subject and body
 */
export async function updateDraft(
  draftId: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Accept both 'draft' and 'pending' statuses
    const { error } = await supabase
      .from('email_drafts')
      .update({ subject, body })
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'pending'])

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/communications')
    revalidatePath('/communications/review')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update draft' }
  }
}

/**
 * Approve a draft and send the email
 */
export async function approveDraft(
  draftId: string
): Promise<{ success: boolean; error?: string; emailSent?: boolean }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // First, update status to 'approved' (accept both 'draft' and 'pending')
    const { data: updated, error } = await supabase
      .from('email_drafts')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'pending'])
      .select()
      .single()

    if (error || !updated) {
      console.error('Failed to approve draft:', error)
      return { success: false, error: error?.message || 'Draft not found or already processed' }
    }

    // Now send the email
    const { sendEmail } = await import('./send-email')
    const sendResult = await sendEmail({ draftId })

    if (!sendResult.success) {
      console.error('Failed to send email:', sendResult.error)
      // Email failed but draft is approved - return partial success
      revalidatePath('/communications')
      revalidatePath('/communications/review')
      return {
        success: true,
        emailSent: false,
        error: `Approved but failed to send: ${sendResult.error}`
      }
    }

    revalidatePath('/communications')
    revalidatePath('/communications/review')
    return { success: true, emailSent: true }
  } catch (error) {
    console.error('Approve draft error:', error)
    return { success: false, error: 'Failed to approve draft' }
  }
}

/**
 * Reject a draft
 */
export async function rejectDraft(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Accept both 'draft' and 'pending' statuses
    const { error } = await supabase
      .from('email_drafts')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'pending'])

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/communications')
    revalidatePath('/communications/review')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to reject draft' }
  }
}

/**
 * Regenerate a draft using AI
 */
export async function regenerateDraft(
  draftId: string
): Promise<{ success: boolean; error?: string; subject?: string; body?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // 1. Read the existing draft to get contactId, emailType, context
    const { data: existingDraft, error: fetchError } = await supabase
      .from('email_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !existingDraft) {
      return { success: false, error: 'Draft not found' }
    }

    // Only allow regenerating draft or pending drafts
    if (!['draft', 'pending'].includes(existingDraft.status)) {
      return { success: false, error: 'Can only regenerate pending drafts' }
    }

    // 2. Map database email_type back to our EmailType
    const emailTypeMap: Record<string, EmailType> = {
      'thank_you': 'thank_you',
      'follow_up': 'reengagement',
      'confirmation': 'volunteer_confirmation',
      'reminder': 'volunteer_reminder',
    }

    const emailType = emailTypeMap[existingDraft.email_type] || 'thank_you'

    // Build context from trigger_event and trigger_event_id
    const context: { giftId?: string; shiftId?: string } = {}
    if (existingDraft.trigger_event === 'gift_received' && existingDraft.trigger_event_id) {
      context.giftId = existingDraft.trigger_event_id
    }
    if (existingDraft.trigger_event === 'shift_signup' && existingDraft.trigger_event_id) {
      context.shiftId = existingDraft.trigger_event_id
    }

    // 3. Call generateDraft with those parameters (this creates a NEW draft)
    const result = await generateDraft({
      organizationId,
      contactId: existingDraft.contact_id,
      emailType,
      context,
    })

    if (!result.success || !result.subject || !result.body) {
      return { success: false, error: result.error || 'Failed to regenerate draft' }
    }

    // 4. Update the existing draft with new subject/body (instead of keeping the new one)
    const { error: updateError } = await supabase
      .from('email_drafts')
      .update({
        subject: result.subject,
        body: result.body,
      })
      .eq('id', draftId)
      .eq('organization_id', organizationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Delete the newly created draft since we updated the existing one
    if (result.draftId) {
      await supabase
        .from('email_drafts')
        .delete()
        .eq('id', result.draftId)
    }

    revalidatePath('/communications')
    revalidatePath('/communications/review')
    return { success: true, subject: result.subject, body: result.body }
  } catch (error) {
    return { success: false, error: 'Failed to regenerate draft' }
  }
}
