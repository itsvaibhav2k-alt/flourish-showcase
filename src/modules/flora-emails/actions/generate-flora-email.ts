/**
 * Generate Flora Email Action
 *
 * Batch generate AI-powered emails for multiple recipients
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generateDraft, type EmailType } from '@/modules/communications/actions/generate-draft'
import type { GenerateFloraEmailParams, EmailDraftResult } from '../schemas/flora-email.schema'

/**
 * Map Flora template types to internal email types
 */
function mapTemplateToEmailType(template: GenerateFloraEmailParams['templateType']): EmailType {
  const mapping = {
    'thank-you': 'thank_you' as const,
    'appeal': 'custom' as const,
    're-engagement': 'reengagement' as const,
    'volunteer': 'volunteer_thank_you' as const,
    'custom': 'custom_advanced' as const,
  }
  return mapping[template]
}

export interface GenerateFloraEmailResult {
  success: boolean
  drafts?: EmailDraftResult[]
  error?: string
  failedCount?: number
}

/**
 * Generate Flora emails for multiple recipients
 */
export async function generateFloraEmail(
  params: GenerateFloraEmailParams
): Promise<GenerateFloraEmailResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId || organizationId !== params.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { templateType, recipientIds, options, customParams } = params

    if (recipientIds.length === 0) {
      return { success: false, error: 'No recipients selected' }
    }

    // Validate custom params for custom template
    if (templateType === 'custom' && !customParams?.topic) {
      return { success: false, error: 'Topic is required for custom emails' }
    }

    // Map template to email type
    const emailType = mapTemplateToEmailType(templateType)

    // Generate drafts for each recipient
    const results = await Promise.allSettled(
      recipientIds.map(async (contactId) => {
        const result = await generateDraft({
          organizationId,
          contactId,
          emailType,
          context: {
            // For thank-you emails, we'd need a giftId
            // For now, we'll generate generic emails
          },
          // Pass custom params for custom_advanced email type
          customParams: templateType === 'custom' ? customParams : undefined,
        })

        if (!result.success || !result.draftId) {
          throw new Error(result.error || 'Failed to generate draft')
        }

        return {
          id: result.draftId,
          contactId,
          subject: result.subject || '',
          body: result.body || '',
          status: 'draft' as const,
        }
      })
    )

    // Collect successful drafts
    const drafts: EmailDraftResult[] = []
    let failedCount = 0

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        drafts.push(result.value)
      } else {
        failedCount++
        console.error('Draft generation failed:', result.reason)
      }
    })

    if (drafts.length === 0) {
      return {
        success: false,
        error: 'Failed to generate any emails',
        failedCount,
      }
    }

    return {
      success: true,
      drafts,
      failedCount: failedCount > 0 ? failedCount : undefined,
    }
  } catch (error) {
    console.error('Generate Flora email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate emails',
    }
  }
}

/**
 * Send approved Flora emails
 * Sends emails directly using Resend for immediate delivery
 */
export async function sendFloraEmails(draftIds: string[]): Promise<{
  success: boolean
  sentCount?: number
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Fetch organization info for branding
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', organizationId)
      .single()

    const orgName = org?.name || 'Our Organization'

    // Fetch the drafts with contact information
    const { data: drafts, error: fetchError } = await supabase
      .from('email_drafts')
      .select(`
        *,
        contact:contacts(email, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .in('id', draftIds)

    if (fetchError) {
      throw fetchError
    }

    if (!drafts || drafts.length === 0) {
      return { success: false, error: 'No drafts found' }
    }

    // Import Resend email function and email template
    const { sendEmail } = await import('@/lib/email/resend')
    const { render } = await import('@react-email/components')
    const { CustomEmail } = await import('@/lib/email/templates/custom-email')

    // Send each email directly
    let sentCount = 0
    const errors: string[] = []

    console.log(`[Flora Email] Sending ${drafts.length} emails...`)

    for (const draft of drafts) {
      if (!draft.contact?.email) {
        console.log(`[Flora Email] No email for draft ${draft.id}`)
        errors.push(`No email for draft ${draft.id}`)
        continue
      }

      const recipientName = [draft.contact.first_name, draft.contact.last_name]
        .filter(Boolean)
        .join(' ') || 'Friend'

      console.log(`[Flora Email] Sending to: ${draft.contact.email}, Subject: ${draft.subject}`)

      try {
        // Render the beautiful email template
        const emailHtml = await render(
          CustomEmail({
            recipientName,
            subject: draft.subject,
            body: draft.body,
            orgName,
          })
        )

        const result = await sendEmail({
          to: draft.contact.email,
          subject: draft.subject,
          body: emailHtml,
          from: 'noreply@flourishnpo.com',
        })

        console.log(`[Flora Email] Resend result:`, JSON.stringify(result))

        if (result.success) {
          // Update draft status to sent
          await supabase
            .from('email_drafts')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', draft.id)

          // Log activity
          await supabase
            .from('activities')
            .insert({
              organization_id: organizationId,
              contact_id: draft.contact_id,
              activity_type: 'email_sent',
              description: `Email sent: ${draft.subject}`,
              metadata: {
                emailDraftId: draft.id,
                emailType: draft.email_type,
                source: 'flora_compose',
              },
            })

          sentCount++
        } else {
          errors.push(`Failed to send to ${draft.contact.email}: ${result.error}`)
          // Update draft status to rejected
          await supabase
            .from('email_drafts')
            .update({ status: 'rejected' })
            .eq('id', draft.id)
        }
      } catch (sendError) {
        errors.push(`Error sending to ${draft.contact.email}: ${sendError}`)
      }
    }

    if (sentCount === 0 && errors.length > 0) {
      return {
        success: false,
        error: errors.join('; '),
        sentCount: 0,
      }
    }

    return {
      success: true,
      sentCount,
      error: errors.length > 0 ? `${errors.length} emails failed` : undefined,
    }
  } catch (error) {
    console.error('Send Flora emails error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send emails',
    }
  }
}

/**
 * Save draft email
 */
export async function saveDraft(params: {
  contactId: string
  subject: string
  body: string
  emailType: string
}): Promise<{
  success: boolean
  draftId?: string
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_drafts')
      .insert({
        organization_id: organizationId,
        contact_id: params.contactId,
        email_type: params.emailType,
        subject: params.subject,
        body: params.body,
        status: 'draft',
        trigger_event: 'manual',
      })
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('Failed to save draft')
    }

    return {
      success: true,
      draftId: data.id,
    }
  } catch (error) {
    console.error('Save draft error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft',
    }
  }
}

/**
 * Custom email generation parameters
 */
export interface GenerateCustomEmailParams {
  organizationId: string
  recipientIds: string[]
  customParams: {
    topic: string
    keyPoints?: string[]
    tone?: 'warm' | 'professional' | 'casual' | 'formal' | 'spiritual' | 'urgent'
    callToAction?: string
    subjectHint?: string
  }
}

/**
 * Generate custom emails with user-defined parameters
 *
 * This is a convenience wrapper around generateFloraEmail that specifically
 * handles the custom email template with all its parameters.
 */
export async function generateCustomEmail(
  params: GenerateCustomEmailParams
): Promise<GenerateFloraEmailResult> {
  return generateFloraEmail({
    organizationId: params.organizationId,
    templateType: 'custom',
    recipientIds: params.recipientIds,
    customParams: params.customParams,
  })
}
