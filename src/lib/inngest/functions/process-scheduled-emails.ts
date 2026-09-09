/**
 * Process Scheduled Emails
 *
 * Cron job that runs every minute to process scheduled emails.
 * Finds scheduled emails where next_run_at <= now() and generates
 * drafts for matching recipients.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDraft, EmailType } from '@/modules/communications/actions/generate-draft'

interface ScheduledEmailConfig {
  email_type: EmailType
  custom_params?: {
    subject_template?: string
    body_template?: string
    gift_id?: string
    shift_id?: string
  }
  recipient_filter?: {
    is_donor?: boolean
    is_volunteer?: boolean
    segments?: string[]
    tags?: string[]
    last_gift_days_ago_min?: number
    last_gift_days_ago_max?: number
    lifetime_giving_min?: number
    lifetime_giving_max?: number
    limit?: number
  }
}

interface ScheduledEmail {
  id: string
  organization_id: string
  name: string
  email_type: string
  custom_params: ScheduledEmailConfig['custom_params']
  recipient_filter: ScheduledEmailConfig['recipient_filter']
  schedule_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron'
  cron_expression: string | null
  next_run_at: string
  last_run_at: string | null
  is_active: boolean
}

export const processScheduledEmails = inngest.createFunction(
  {
    id: 'process-scheduled-emails',
    name: 'Process Scheduled Emails',
    concurrency: {
      limit: 1, // Only one instance at a time
    },
  },
  { cron: '0 */4 * * *' }, // Every 4 hours
  async ({ step }) => {
    // Step 1: Find scheduled emails that are due
    const dueEmails = await step.run('find-due-scheduled-emails', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('is_active', true)
        .lte('next_run_at', new Date().toISOString())
        .order('next_run_at', { ascending: true })
        .limit(10) // Process max 10 at a time

      if (error) {
        console.error('Error fetching scheduled emails:', error)
        return []
      }

      return data as ScheduledEmail[]
    })

    if (dueEmails.length === 0) {
      return { message: 'No scheduled emails due', count: 0 }
    }

    // Step 2: Process each scheduled email
    const results = await step.run('process-scheduled-emails', async () => {
      const supabase = createAdminClient()
      const processResults = []

      for (const scheduledEmail of dueEmails) {
        try {
          // Find matching contacts based on recipient_filter
          const contacts = await findMatchingContacts(
            scheduledEmail.organization_id,
            scheduledEmail.recipient_filter,
            supabase
          )

          if (contacts.length === 0) {
            processResults.push({
              scheduledEmailId: scheduledEmail.id,
              name: scheduledEmail.name,
              status: 'no_recipients',
              message: 'No contacts match the filter criteria',
            })

            // Update last_run and next_run anyway
            await updateScheduledEmailTiming(scheduledEmail, supabase)
            continue
          }

          // Generate drafts for each contact
          const draftResults = []

          for (const contact of contacts) {
            try {
              const result = await generateDraft({
                organizationId: scheduledEmail.organization_id,
                contactId: contact.id,
                emailType: scheduledEmail.email_type as EmailType,
                context: {
                  giftId: scheduledEmail.custom_params?.gift_id,
                  shiftId: scheduledEmail.custom_params?.shift_id,
                },
              })

              draftResults.push({
                contactId: contact.id,
                success: result.success,
                draftId: result.draftId,
                error: result.error,
              })
            } catch (error) {
              console.error(`Error generating draft for contact ${contact.id}:`, error)
              draftResults.push({
                contactId: contact.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }

          const successCount = draftResults.filter((r) => r.success).length
          const failureCount = draftResults.filter((r) => !r.success).length

          // Update last_run_at and calculate next_run_at
          await updateScheduledEmailTiming(scheduledEmail, supabase, {
            drafts_generated: successCount,
            drafts_failed: failureCount,
            contacts_matched: contacts.length,
          })

          processResults.push({
            scheduledEmailId: scheduledEmail.id,
            name: scheduledEmail.name,
            status: 'processed',
            contactsMatched: contacts.length,
            draftsGenerated: successCount,
            draftsFailed: failureCount,
          })
        } catch (error) {
          console.error(`Error processing scheduled email ${scheduledEmail.id}:`, error)
          processResults.push({
            scheduledEmailId: scheduledEmail.id,
            name: scheduledEmail.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return processResults
    })

    const successCount = results.filter((r: any) => r.status === 'processed').length
    const noRecipientCount = results.filter((r: any) => r.status === 'no_recipients').length
    const errorCount = results.filter((r: any) => r.status === 'error').length

    return {
      message: `Processed ${dueEmails.length} scheduled emails`,
      successCount,
      noRecipientCount,
      errorCount,
      results,
    }
  }
)

/**
 * Find contacts matching the recipient filter
 */
async function findMatchingContacts(
  organizationId: string,
  filter: ScheduledEmailConfig['recipient_filter'],
  supabase: ReturnType<typeof createAdminClient>
): Promise<Array<{ id: string; email: string }>> {
  let query = supabase
    .from('contacts')
    .select('id, email')
    .eq('organization_id', organizationId)
    .not('email', 'is', null)

  if (filter) {
    // Filter by donor status
    if (filter.is_donor !== undefined) {
      query = query.eq('is_donor', filter.is_donor)
    }

    // Filter by volunteer status
    if (filter.is_volunteer !== undefined) {
      query = query.eq('is_volunteer', filter.is_volunteer)
    }

    // Filter by lifetime giving
    if (filter.lifetime_giving_min !== undefined) {
      query = query.gte('lifetime_giving', filter.lifetime_giving_min)
    }

    if (filter.lifetime_giving_max !== undefined) {
      query = query.lte('lifetime_giving', filter.lifetime_giving_max)
    }

    // Filter by last gift date
    if (filter.last_gift_days_ago_min !== undefined) {
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() - filter.last_gift_days_ago_min)
      query = query.lte('last_gift_date', maxDate.toISOString())
    }

    if (filter.last_gift_days_ago_max !== undefined) {
      const minDate = new Date()
      minDate.setDate(minDate.getDate() - filter.last_gift_days_ago_max)
      query = query.gte('last_gift_date', minDate.toISOString())
    }

    // Limit results
    const limit = filter.limit || 50 // Default to 50 contacts
    query = query.limit(limit)
  } else {
    // Default limit
    query = query.limit(50)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error finding contacts:', error)
    return []
  }

  return data || []
}

/**
 * Update scheduled email timing after processing
 */
async function updateScheduledEmailTiming(
  scheduledEmail: ScheduledEmail,
  supabase: ReturnType<typeof createAdminClient>,
  result?: Record<string, unknown>
) {
  const now = new Date()

  // Calculate next run time based on schedule type
  let nextRunAt: Date | null = null

  switch (scheduledEmail.schedule_type) {
    case 'once':
      // One-time emails don't run again - deactivate
      nextRunAt = null
      break

    case 'daily':
      nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      break

    case 'weekly':
      nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      break

    case 'monthly':
      nextRunAt = new Date(now)
      nextRunAt.setMonth(nextRunAt.getMonth() + 1)
      break

    case 'cron':
      // For cron, we'd need a proper parser
      // For now, default to daily
      nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      break
  }

  const updates: Record<string, unknown> = {
    last_run_at: now.toISOString(),
    last_run_result: result || {},
    updated_at: now.toISOString(),
  }

  if (nextRunAt) {
    updates.next_run_at = nextRunAt.toISOString()
  } else {
    // Deactivate one-time emails after running
    updates.is_active = false
    updates.next_run_at = null
  }

  await supabase
    .from('scheduled_emails')
    .update(updates)
    .eq('id', scheduledEmail.id)
}

/**
 * Event-triggered function to manually trigger a scheduled email
 */
export const triggerScheduledEmail = inngest.createFunction(
  {
    id: 'trigger-scheduled-email',
    name: 'Trigger Scheduled Email',
  },
  { event: 'scheduled-email/trigger' },
  async ({ event, step }) => {
    const { scheduledEmailId, organizationId } = event.data

    // Fetch the scheduled email
    const scheduledEmail = await step.run('fetch-scheduled-email', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('id', scheduledEmailId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        throw new Error('Scheduled email not found')
      }

      return data as ScheduledEmail
    })

    // Find matching contacts
    const contacts = await step.run('find-matching-contacts', async () => {
      const supabase = createAdminClient()
      return findMatchingContacts(
        scheduledEmail.organization_id,
        scheduledEmail.recipient_filter,
        supabase
      )
    })

    if (contacts.length === 0) {
      return {
        success: false,
        message: 'No contacts match the filter criteria',
      }
    }

    // Generate drafts
    const results = await step.run('generate-drafts', async () => {
      const draftResults = []

      for (const contact of contacts) {
        try {
          const result = await generateDraft({
            organizationId: scheduledEmail.organization_id,
            contactId: contact.id,
            emailType: scheduledEmail.email_type as EmailType,
            context: {
              giftId: scheduledEmail.custom_params?.gift_id,
              shiftId: scheduledEmail.custom_params?.shift_id,
            },
          })

          draftResults.push({
            contactId: contact.id,
            success: result.success,
            draftId: result.draftId,
            error: result.error,
          })
        } catch (error) {
          draftResults.push({
            contactId: contact.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return draftResults
    })

    const successCount = results.filter((r: any) => r.success).length
    const failureCount = results.filter((r: any) => !r.success).length

    // Update the scheduled email
    await step.run('update-scheduled-email', async () => {
      const supabase = createAdminClient()

      await supabase
        .from('scheduled_emails')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_result: {
            triggered_manually: true,
            drafts_generated: successCount,
            drafts_failed: failureCount,
            contacts_matched: contacts.length,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduledEmailId)
    })

    return {
      success: true,
      contactsMatched: contacts.length,
      draftsGenerated: successCount,
      draftsFailed: failureCount,
      results,
    }
  }
)
