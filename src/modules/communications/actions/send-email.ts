/**
 * Send Email Action
 *
 * Server action to send approved email drafts via Resend.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { logEmailActivity } from '@/lib/activity'
import type { EmailType as TemplateEmailType } from '@/lib/email/templates'

// Lazy initialization of Resend client
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export interface SendEmailParams {
  draftId: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  error?: string
  emailId?: string
}

/**
 * Send an approved email draft
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const { draftId, fromName, fromEmail, replyTo } = params

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

    // Get draft with contact and organization info
    const { data: draft, error: draftError } = await supabase
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

    // Check if draft is approved
    if (draft.status !== 'approved') {
      return {
        success: false,
        error: `Cannot send ${draft.status} draft. Draft must be approved first.`,
      }
    }

    // Verify contact has email
    if (!draft.contacts?.email) {
      return {
        success: false,
        error: 'Contact does not have an email address',
      }
    }

    // Prepare email
    const orgName = draft.organizations?.name || 'Your Organization'
    // Always use the verified domain for sending - Resend requires domain verification
    const verifiedFromEmail = 'noreply@flourishnpo.com'

    // Helper to validate email domain
    const isVerifiedDomain = (email: string | undefined): boolean => {
      if (!email) return false
      const domain = email.split('@')[1]?.toLowerCase()
      return domain === 'flourishnpo.com'
    }

    // Determine safe from email - ALWAYS validate, even env vars
    let safeFromEmail = verifiedFromEmail // Start with verified domain

    // Check if fromEmail parameter is valid
    if (fromEmail && isVerifiedDomain(fromEmail)) {
      safeFromEmail = fromEmail
    }
    // Check if env var is valid (but only if no valid fromEmail provided)
    else if (!fromEmail && process.env.RESEND_FROM_EMAIL && isVerifiedDomain(process.env.RESEND_FROM_EMAIL)) {
      safeFromEmail = process.env.RESEND_FROM_EMAIL
    }
    // Log warning if invalid domain was attempted
    else if (fromEmail || process.env.RESEND_FROM_EMAIL) {
      const attemptedEmail = fromEmail || process.env.RESEND_FROM_EMAIL
      console.warn(`Invalid from email domain: ${attemptedEmail}. Using verified domain: ${verifiedFromEmail}`)
    }

    const from = `${fromName || orgName} <${safeFromEmail}>`

    const to = draft.contacts.email
    const subject = draft.subject
    const recipientName = `${draft.contacts.first_name} ${draft.contacts.last_name}`.trim()

    const html = await formatEmailBody({
      draft,
      organizationName: orgName,
      recipientName,
    })

    // Send via Resend with tracking enabled
    const resend = getResendClient()
    const { data, error: sendError } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: replyTo || fromEmail,
      // Enable email tracking for opens and clicks
      headers: {
        'X-Entity-Ref-ID': draftId, // Custom header for reference
      },
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return {
        success: false,
        error: `Failed to send email: ${sendError.message}`,
      }
    }

    // Update draft status
    const { error: updateError } = await supabase
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        resend_id: data?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    if (updateError) {
      console.error('Failed to update draft status:', updateError)
      // Email was sent, but we couldn't update the status
      // This is not a critical error
    }

    // Log activity
    await logEmailActivity({
      organizationId: draft.organization_id,
      contactId: draft.contact_id,
      draftId,
      emailType: draft.email_type ?? 'other',
      subject,
      action: 'sent',
    })

    // Update gift thanked_at if this is a thank-you email
    if (draft.email_type === 'thank_you' && (draft.trigger_event === 'gift' || draft.trigger_event === 'gift_received') && draft.trigger_event_id) {
      await supabase
        .from('gifts')
        .update({ thanked_at: new Date().toISOString() })
        .eq('id', draft.trigger_event_id)
    }

    // Update shift signup confirmation_sent if this is a confirmation
    if (draft.email_type === 'volunteer_confirmation' && draft.trigger_event === 'shift_signup' && draft.trigger_event_id) {
      await supabase
        .from('shift_signups')
        .update({ confirmation_sent: true })
        .eq('id', draft.trigger_event_id)
    }

    // Update shift signup thank_you_sent if this is a volunteer thank you
    if (draft.email_type === 'volunteer_thank_you' && draft.trigger_event === 'shift_signup' && draft.trigger_event_id) {
      await supabase
        .from('shift_signups')
        .update({ thank_you_sent: true })
        .eq('id', draft.trigger_event_id)
        .eq('contact_id', draft.contact_id)
    }

    revalidatePath('/communications')
    revalidatePath(`/communications/drafts/${draftId}`)

    return {
      success: true,
      emailId: data?.id,
    }
  } catch (error) {
    console.error('Send email error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send email. Please try again.',
    }
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(params: {
  draftIds: string[]
  fromName?: string
  fromEmail?: string
  replyTo?: string
}): Promise<{
  success: boolean
  results: Array<{ draftId: string; success: boolean; error?: string }>
  successCount: number
  failureCount: number
}> {
  const results = await Promise.all(
    params.draftIds.map(async draftId => {
      const result = await sendEmail({
        draftId,
        fromName: params.fromName,
        fromEmail: params.fromEmail,
        replyTo: params.replyTo,
      })

      return {
        draftId,
        success: result.success,
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
 * Email draft type for internal use
 */
interface EmailDraftForFormatting {
  id: string
  email_type: string
  body: string
  trigger_event?: string | null
  trigger_event_id?: string | null
  organization_id: string
}

/**
 * Template data types for different email types
 */
interface ThankYouTemplateData {
  donorName: string
  amount: number
  orgName: string
  body: string
  giftDate?: string
  signerName?: string
  signerTitle?: string
  websiteUrl?: string
}

interface VolunteerConfirmationTemplateData {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location: string | null
  body: string
}

interface VolunteerThankYouTemplateData {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  body: string
}

interface ReengagementTemplateData {
  contactName: string
  orgName: string
  body: string
}

type TemplateData =
  | ThankYouTemplateData
  | VolunteerConfirmationTemplateData
  | VolunteerThankYouTemplateData
  | ReengagementTemplateData

/**
 * Format email body with proper HTML structure
 * Uses React email templates when available, falls back to simple HTML
 */
async function formatEmailBody(params: {
  draft: EmailDraftForFormatting
  organizationName: string
  recipientName: string
}): Promise<string> {
  const { draft, organizationName, recipientName } = params

  // Try to use React email templates for better design
  try {
    const { renderEmailTemplate, hasEmailTemplate, getDefaultEmailTemplate } =
      await import('@/lib/email/templates')

    // Check if the email type is a valid template type
    const validTemplateTypes: TemplateEmailType[] = ['thank_you', 'volunteer_confirmation', 'volunteer_reminder', 'volunteer_thank_you', 'reengagement']
    const emailType = draft.email_type as TemplateEmailType

    if (validTemplateTypes.includes(emailType) && hasEmailTemplate(emailType)) {
      // Build template data based on email type
      const templateData = await buildTemplateData({
        draft,
        organizationName,
        recipientName,
      })

      if (templateData) {
        return renderEmailTemplate(emailType, templateData)
      }
    }

    // Fall back to default template
    return getDefaultEmailTemplate({
      body: draft.body,
      orgName: organizationName,
      recipientName,
    })
  } catch (error) {
    console.error('Error rendering email template:', error)

    // Final fallback: simple HTML
    return getSimpleEmailTemplate({
      body: draft.body,
      organizationName,
      recipientName,
    })
  }
}

/**
 * Convert plain text to HTML paragraphs
 */
function textToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p style="margin: 0 0 16px 0;">${line}</p>`)
    .join('')
}

/**
 * Build template data for React email templates
 */
async function buildTemplateData(params: {
  draft: EmailDraftForFormatting
  organizationName: string
  recipientName: string
}): Promise<TemplateData | null> {
  const { draft, organizationName, recipientName } = params
  const supabase = await createClient()

  // Convert plain text body to HTML
  const htmlBody = textToHtml(draft.body)

  try {
    switch (draft.email_type) {
      case 'thank_you': {
        // Get gift ID from trigger_event_id when trigger_event is 'gift_received'
        const giftId = draft.trigger_event === 'gift_received' ? draft.trigger_event_id : null
        if (!giftId) return null

        // Fetch gift data
        const { data: gift } = await supabase
          .from('gifts')
          .select('amount, gift_date')
          .eq('id', giftId)
          .single()

        if (!gift) return null

        // Fetch organization admin/owner for signer
        let signerName = 'The Team'
        let signerTitle = 'Executive Director'

        const { data: orgAdmin } = await supabase
          .from('organization_members')
          .select('user_id, role')
          .eq('organization_id', draft.organization_id)
          .in('role', ['owner', 'admin'])
          .limit(1)
          .single()

        if (orgAdmin?.user_id) {
          const { data: adminUser } = await supabase
            .from('users')
            .select('name')
            .eq('id', orgAdmin.user_id)
            .single()

          if (adminUser?.name) {
            signerName = adminUser.name
            signerTitle = orgAdmin.role === 'owner' ? 'Executive Director' : 'Development Director'
          }
        }

        return {
          donorName: recipientName,
          amount: gift.amount,
          orgName: organizationName,
          body: htmlBody,
          giftDate: gift.gift_date
            ? new Date(gift.gift_date).toLocaleDateString()
            : undefined,
          signerName,
          signerTitle,
        }
      }

      case 'volunteer_confirmation':
      case 'volunteer_thank_you': {
        // Get shift ID from trigger_event_id when trigger_event is 'shift_signup'
        const shiftId = draft.trigger_event === 'shift_signup' ? draft.trigger_event_id : null
        if (!shiftId) return null

        // Fetch shift data
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('title, start_time, end_time, location')
          .eq('id', shiftId)
          .single()

        if (!shiftData) return null

        const shift = shiftData

        // Format shift date and time from start_time
        const shiftDate = shift.start_time
          ? new Date(shift.start_time).toLocaleDateString()
          : 'TBD'
        const shiftTime = shift.start_time && shift.end_time
          ? `${new Date(shift.start_time).toLocaleTimeString()} - ${new Date(shift.end_time).toLocaleTimeString()}`
          : shift.start_time
          ? new Date(shift.start_time).toLocaleTimeString()
          : 'TBD'

        if (draft.email_type === 'volunteer_confirmation') {
          return {
            volunteerName: recipientName,
            orgName: organizationName,
            shiftTitle: shift.title,
            shiftDate,
            shiftTime,
            location: shift.location,
            body: htmlBody,
          }
        } else {
          // volunteer_thank_you
          return {
            volunteerName: recipientName,
            orgName: organizationName,
            shiftTitle: shift.title,
            shiftDate,
            body: htmlBody,
          }
        }
      }

      case 'reengagement': {
        return {
          contactName: recipientName,
          orgName: organizationName,
          body: htmlBody,
        }
      }

      default:
        return null
    }
  } catch (error) {
    console.error('Error building template data:', error)
    return null
  }
}

/**
 * Simple fallback email template
 */
function getSimpleEmailTemplate(params: {
  body: string
  organizationName: string
  recipientName: string
}): string {
  const { body, organizationName, recipientName } = params

  // Convert line breaks to <p> tags
  const formattedBody = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('\n')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${organizationName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p {
      margin: 0 0 16px 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <p>Dear ${recipientName},</p>
  ${formattedBody}

  <div class="footer">
    <p>${organizationName}</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Check delivery status of a sent email via Resend
 * @param resendId - The Resend email ID
 * @returns Delivery status information
 */
export async function checkEmailDeliveryStatus(resendId: string): Promise<{
  success: boolean
  status?: string
  error?: string
}> {
  try {
    const resend = getResendClient()

    // Note: Resend's API may have rate limits on status checks
    const { data, error } = await resend.emails.get(resendId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      status: data?.last_event || 'unknown',
    }
  } catch (error) {
    console.error('Error checking delivery status:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check delivery status',
    }
  }
}

/**
 * Retry sending a failed email
 * @param draftId - The draft ID to retry
 * @returns Result of the retry attempt
 */
export async function retrySendEmail(
  draftId: string
): Promise<SendEmailResult> {
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

    // Get draft
    const { data: draft, error: draftError } = await supabase
      .from('email_drafts')
      .select('*')
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

    // Check if draft is in a state that allows retry
    if (draft.status !== 'approved') {
      return {
        success: false,
        error: 'Can only retry approved drafts that failed to send',
      }
    }

    // Reset sent status and retry
    await supabase
      .from('email_drafts')
      .update({
        sent_at: null,
        sent_by: null,
        resend_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)

    // Retry sending
    return await sendEmail({ draftId })
  } catch (error) {
    console.error('Retry send email error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to retry sending email',
    }
  }
}

/**
 * Get email send statistics for an organization
 */
export async function getEmailStats(organizationId: string) {
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

  // Get sent emails from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: emails, error } = await supabase
    .from('email_drafts')
    .select('email_type, sent_at')
    .eq('organization_id', organizationId)
    .eq('status', 'sent')
    .gte('sent_at', thirtyDaysAgo.toISOString())

  if (error) {
    return null
  }

  const stats = {
    totalSent: emails?.length || 0,
    byType: {
      thank_you: 0,
      reengagement: 0,
      volunteer_confirmation: 0,
      volunteer_reminder: 0,
      volunteer_thank_you: 0,
    },
    last7Days: 0,
    last30Days: emails?.length || 0,
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  emails?.forEach(email => {
    // Count by type
    if (email.email_type && email.email_type in stats.byType) {
      stats.byType[email.email_type as keyof typeof stats.byType]++
    }

    // Count last 7 days
    if (email.sent_at && new Date(email.sent_at) > sevenDaysAgo) {
      stats.last7Days++
    }
  })

  return stats
}
