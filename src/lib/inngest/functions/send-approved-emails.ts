import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'

export const sendApprovedEmails = inngest.createFunction(
  {
    id: 'send-approved-emails',
    name: 'Send Approved Emails',
  },
  { cron: '0 */2 * * *' }, // Every 2 hours
  async ({ step }) => {
    // Step 1: Query approved email drafts
    const approvedEmails = await step.run('fetch-approved-emails', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_drafts')
        .select(
          `
          *,
          contact:contacts(email, first_name, last_name),
          organization:organizations(name, settings)
        `
        )
        .eq('status', 'approved')
        .is('sent_at', null)
        .limit(50) // Process max 50 emails per batch

      if (error) {
        throw new Error(`Failed to fetch approved emails: ${error.message}`)
      }

      return data || []
    })

    if (approvedEmails.length === 0) {
      return { message: 'No approved emails to send', count: 0 }
    }

    // Step 2: Send each email
    const results = await step.run('send-emails', async () => {
      const sendResults = []

      for (const emailDraft of approvedEmails) {
        try {
          if (!emailDraft.contact?.email) {
            console.error(
              `No email address for contact in draft ${emailDraft.id}`
            )
            sendResults.push({
              draftId: emailDraft.id,
              success: false,
              error: 'No email address',
            })
            continue
          }

          // Get organization settings for from address
          // Always use verified domain - Resend requires domain verification
          const verifiedFromEmail = 'noreply@flourishnpo.com'
          const orgSettings = emailDraft.organization?.settings as any

          // Helper to validate email domain
          const isVerifiedDomain = (email: string | undefined): boolean => {
            if (!email) return false
            const domain = email.split('@')[1]?.toLowerCase()
            return domain === 'flourishnpo.com'
          }

          // Check both property names (email_from is stored, fromEmail was previously used)
          const orgFromEmail = orgSettings?.email_from || orgSettings?.fromEmail

          // Determine safe from email - ALWAYS validate
          let fromEmail = verifiedFromEmail // Start with verified domain

          if (orgFromEmail && isVerifiedDomain(orgFromEmail)) {
            fromEmail = orgFromEmail
          } else if (process.env.RESEND_FROM_EMAIL && isVerifiedDomain(process.env.RESEND_FROM_EMAIL)) {
            fromEmail = process.env.RESEND_FROM_EMAIL
          } else if (orgFromEmail || process.env.RESEND_FROM_EMAIL) {
            const attemptedEmail = orgFromEmail || process.env.RESEND_FROM_EMAIL
            console.warn(`Invalid from email domain: ${attemptedEmail}. Using verified domain: ${verifiedFromEmail}`)
          }

          // Send the email
          const result = await sendEmail({
            to: emailDraft.contact.email,
            subject: emailDraft.subject,
            body: emailDraft.body,
            from: fromEmail,
          })

          sendResults.push({
            draftId: emailDraft.id,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          })
        } catch (error) {
          console.error(
            `Error sending email draft ${emailDraft.id}:`,
            error
          )
          sendResults.push({
            draftId: emailDraft.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return sendResults
    })

    // Step 3: Update email draft statuses
    await step.run('update-email-statuses', async () => {
      const supabase = createAdminClient()

      for (const result of results) {
        const updateData = {
          status: result.success ? 'sent' as const : 'rejected' as const,
          sent_at: result.success ? new Date().toISOString() : null,
        }

        await supabase
          .from('email_drafts')
          .update(updateData)
          .eq('id', result.draftId)
      }
    })

    // Step 4: Log activities for successfully sent emails
    await step.run('log-activities', async () => {
      const supabase = createAdminClient()

      const successfulSends = results.filter((r) => r.success)

      if (successfulSends.length === 0) return

      // Get the email drafts to log activities
      const draftIds = successfulSends.map((r) => r.draftId)
      const { data: drafts } = await supabase
        .from('email_drafts')
        .select('id, organization_id, contact_id, email_type, subject')
        .in('id', draftIds)

      if (!drafts) return

      const activities = drafts.map((draft) => ({
        organization_id: draft.organization_id,
        contact_id: draft.contact_id,
        activity_type: 'email_sent',
        description: `Email sent: ${draft.subject}`,
        metadata: {
          emailDraftId: draft.id,
          emailType: draft.email_type,
        },
      }))

      await supabase.from('activities').insert(activities)
    })

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return {
      message: `Processed ${approvedEmails.length} emails`,
      successCount,
      failureCount,
      results,
    }
  }
)

/**
 * Send specific approved emails triggered by batch-send event
 * This provides immediate sending rather than waiting for the cron job
 */
export const sendBatchEmails = inngest.createFunction(
  {
    id: 'send-batch-emails',
    name: 'Send Batch Emails',
    concurrency: {
      limit: 5, // Limit concurrent email sending
    },
    retries: 2,
  },
  { event: 'email/batch-send' },
  async ({ event, step }) => {
    const { emailIds } = event.data

    if (!emailIds || emailIds.length === 0) {
      return { message: 'No email IDs provided', count: 0 }
    }

    // Step 1: Fetch the specific email drafts
    const emailDrafts = await step.run('fetch-email-drafts', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_drafts')
        .select(
          `
          *,
          contact:contacts(email, first_name, last_name),
          organization:organizations(name, settings)
        `
        )
        .in('id', emailIds)
        .eq('status', 'approved')
        .is('sent_at', null)

      if (error) {
        throw new Error(`Failed to fetch email drafts: ${error.message}`)
      }

      return data || []
    })

    if (emailDrafts.length === 0) {
      return { message: 'No approved emails found to send', count: 0 }
    }

    // Step 2: Send each email
    const results = await step.run('send-batch-emails', async () => {
      const sendResults = []

      for (const emailDraft of emailDrafts) {
        try {
          if (!emailDraft.contact?.email) {
            console.error(
              `No email address for contact in draft ${emailDraft.id}`
            )
            sendResults.push({
              draftId: emailDraft.id,
              success: false,
              error: 'No email address',
            })
            continue
          }

          // Get organization settings for from address
          const verifiedFromEmail = 'noreply@flourishnpo.com'
          const orgSettings = emailDraft.organization?.settings as any

          // Helper to validate email domain
          const isVerifiedDomain = (email: string | undefined): boolean => {
            if (!email) return false
            const domain = email.split('@')[1]?.toLowerCase()
            return domain === 'flourishnpo.com'
          }

          const orgFromEmail = orgSettings?.email_from || orgSettings?.fromEmail
          let fromEmail = verifiedFromEmail

          if (orgFromEmail && isVerifiedDomain(orgFromEmail)) {
            fromEmail = orgFromEmail
          } else if (process.env.RESEND_FROM_EMAIL && isVerifiedDomain(process.env.RESEND_FROM_EMAIL)) {
            fromEmail = process.env.RESEND_FROM_EMAIL
          }

          // Send the email
          const result = await sendEmail({
            to: emailDraft.contact.email,
            subject: emailDraft.subject,
            body: emailDraft.body,
            from: fromEmail,
          })

          sendResults.push({
            draftId: emailDraft.id,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          })
        } catch (error) {
          console.error(
            `Error sending email draft ${emailDraft.id}:`,
            error
          )
          sendResults.push({
            draftId: emailDraft.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return sendResults
    })

    // Step 3: Update email draft statuses
    await step.run('update-batch-email-statuses', async () => {
      const supabase = createAdminClient()

      for (const result of results) {
        const updateData = {
          status: result.success ? 'sent' as const : 'rejected' as const,
          sent_at: result.success ? new Date().toISOString() : null,
        }

        await supabase
          .from('email_drafts')
          .update(updateData)
          .eq('id', result.draftId)
      }
    })

    // Step 4: Log activities for successfully sent emails
    await step.run('log-batch-activities', async () => {
      const supabase = createAdminClient()

      const successfulSends = results.filter((r) => r.success)
      if (successfulSends.length === 0) return

      const draftIds = successfulSends.map((r) => r.draftId)
      const { data: drafts } = await supabase
        .from('email_drafts')
        .select('id, organization_id, contact_id, email_type, subject')
        .in('id', draftIds)

      if (!drafts) return

      const activities = drafts.map((draft) => ({
        organization_id: draft.organization_id,
        contact_id: draft.contact_id,
        activity_type: 'email_sent',
        description: `Email sent: ${draft.subject}`,
        metadata: {
          emailDraftId: draft.id,
          emailType: draft.email_type,
          source: 'flora_batch_send',
        },
      }))

      await supabase.from('activities').insert(activities)
    })

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return {
      message: `Sent ${successCount} of ${emailDrafts.length} emails`,
      successCount,
      failureCount,
      results,
    }
  }
)
