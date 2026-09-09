import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { render } from '@react-email/render'
import VolunteerReminderEmail from '@/lib/email/templates/volunteer-reminder'

type ReminderType = '7day' | '1day' | 'morning'

export const sendVolunteerReminders = inngest.createFunction(
  {
    id: 'send-volunteer-reminders',
    name: 'Send Volunteer Shift Reminders',
  },
  { cron: '0 8 * * *' }, // Daily at 8 AM
  async ({ step }) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Step 1: Find shifts that need reminders
    const shiftsNeedingReminders = await step.run(
      'fetch-shifts-needing-reminders',
      async () => {
        const supabase = createAdminClient()

        // Get shifts and their organization's automation settings
        const { data: shifts, error } = await supabase
          .from('shifts')
          .select(
            `
          *,
          signups:shift_signups(
            *,
            contact:contacts(id, first_name, last_name, email)
          ),
          organization:organizations(
            id,
            name,
            settings,
            auto_volunteer_reminders,
            auto_volunteer_confirmations,
            reminder_hours_before
          )
        `
          )
          .in('status', ['open', 'full'])
          .gte('start_time', today.toISOString())

        if (error) {
          throw new Error(`Failed to fetch shifts: ${error.message}`)
        }

        return shifts || []
      }
    )

    // Step 2: Determine which reminders to send (3-tier: 7-day, 1-day, morning-of)
    const remindersToSend = await step.run(
      'determine-reminders-to-send',
      async () => {
        const reminders: Array<{
          signup: any
          shift: any
          reminderType: ReminderType
          reminderField: string
        }> = []

        for (const shift of shiftsNeedingReminders) {
          // Check if reminders are enabled for this organization
          const org = shift.organization
          if (!org.auto_volunteer_reminders) {
            continue
          }

          const shiftDate = new Date(shift.start_time)
          const hoursUntilShift = (shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          for (const signup of shift.signups || []) {
            // Skip if signup is not confirmed
            if (signup.status !== 'confirmed') continue

            // 7-day reminder: 168 >= hoursUntilShift > 144
            if (
              hoursUntilShift <= 168 &&
              hoursUntilShift > 144 &&
              !signup.reminder_2_sent
            ) {
              reminders.push({
                signup,
                shift,
                reminderType: '7day',
                reminderField: 'reminder_2_sent',
              })
            }

            // 1-day reminder: 36 >= hoursUntilShift > 12
            if (
              hoursUntilShift <= 36 &&
              hoursUntilShift > 12 &&
              !signup.reminder_1_sent
            ) {
              reminders.push({
                signup,
                shift,
                reminderType: '1day',
                reminderField: 'reminder_1_sent',
              })
            }

            // Morning-of reminder: 4 >= hoursUntilShift > 0
            if (
              hoursUntilShift <= 4 &&
              hoursUntilShift > 0 &&
              !signup.morning_reminder_sent
            ) {
              reminders.push({
                signup,
                shift,
                reminderType: 'morning',
                reminderField: 'morning_reminder_sent',
              })
            }
          }
        }

        return reminders
      }
    )

    if (remindersToSend.length === 0) {
      return {
        message: 'No reminders to send',
        count: 0,
      }
    }

    // Step 3: Send reminder emails
    const results = await step.run('send-reminder-emails', async () => {
      const sendResults = []

      for (const reminder of remindersToSend) {
        const { signup, shift, reminderType } = reminder

        try {
          if (!signup.contact?.email) {
            console.error(`No email for contact in signup ${signup.id}`)
            sendResults.push({
              signupId: signup.id,
              success: false,
              error: 'No email address',
            })
            continue
          }

          // Format shift date and time
          const shiftDate = new Date(shift.start_time)
          const endTime = new Date(shift.end_time)

          const formattedDate = shiftDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          const formattedTime = `${shiftDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })} - ${endTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}`

          // Render email template
          const emailHtml = await render(
            VolunteerReminderEmail({
              volunteerName: signup.contact.first_name,
              orgName: shift.organization.name,
              shiftTitle: shift.title,
              shiftDate: formattedDate,
              shiftTime: formattedTime,
              location: shift.location,
              reminderType,
            })
          )

          // Get reminder type display name
          const reminderTypeDisplay =
            reminderType === '7day'
              ? '7-day reminder'
              : reminderType === '1day'
                ? '1-day reminder'
                : 'day-of reminder'

          const subject = `Reminder: ${shift.title} - ${formattedDate}`

          // Get organization settings for from address
          // Always use verified domain - Resend requires domain verification
          const verifiedFromEmail = 'noreply@flourishnpo.com'
          const orgSettings = shift.organization?.settings as any

          // Helper to validate email domain
          const isVerifiedDomain = (email: string | undefined): boolean => {
            if (!email) return false
            const domain = email.split('@')[1]?.toLowerCase()
            return domain === 'flourishnpo.com'
          }

          // Check both property names
          const orgFromEmail = orgSettings?.email_from || orgSettings?.fromEmail

          // Determine safe from email - ALWAYS validate
          let fromEmail = verifiedFromEmail
          if (orgFromEmail && isVerifiedDomain(orgFromEmail)) {
            fromEmail = orgFromEmail
          } else if (process.env.RESEND_FROM_EMAIL && isVerifiedDomain(process.env.RESEND_FROM_EMAIL)) {
            fromEmail = process.env.RESEND_FROM_EMAIL
          }

          // Send the email
          const result = await sendEmail({
            to: signup.contact.email,
            subject,
            body: emailHtml,
            from: fromEmail,
          })

          sendResults.push({
            signupId: signup.id,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
            reminderType,
          })
        } catch (error) {
          console.error(`Error sending reminder for signup ${signup.id}:`, error)
          sendResults.push({
            signupId: signup.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            reminderType,
          })
        }
      }

      return sendResults
    })

    // Step 4: Update reminder flags on signups (grouped by reminder type)
    await step.run('update-reminder-flags', async () => {
      const supabase = createAdminClient()

      // Group successful signups by their reminder field
      const flagGroups: Record<string, string[]> = {}
      results.forEach((result, i) => {
        if (result.success) {
          const field = remindersToSend[i].reminderField
          if (!flagGroups[field]) flagGroups[field] = []
          flagGroups[field].push(remindersToSend[i].signup.id)
        }
      })

      // Batch update each flag group
      for (const [field, ids] of Object.entries(flagGroups)) {
        if (ids.length > 0) {
          const { error } = await supabase
            .from('shift_signups')
            .update({ [field]: true })
            .in('id', ids)

          if (error) {
            console.error(`Failed to update ${field} flags:`, error)
          }
        }
      }
    })

    // Step 5: Log activities
    await step.run('log-activities', async () => {
      const supabase = createAdminClient()

      const successfulReminders = results
        .map((r, i) => ({ ...r, ...remindersToSend[i] }))
        .filter((r) => r.success)

      if (successfulReminders.length === 0) return

      const activities = successfulReminders.map((r) => ({
        organization_id: r.shift.organization_id,
        contact_id: r.signup.contact_id,
        activity_type: 'email_sent',
        description: `Volunteer reminder sent for shift: ${r.shift.title}`,
        metadata: {
          shiftId: r.shift.id,
          signupId: r.signup.id,
          reminderType: r.reminderType,
        },
      }))

      await supabase.from('activities').insert(activities)
    })

    // Step 6: Check if voice reminders should be sent for imminent shifts
    const voiceRemindersQueued = await step.run(
      'check-voice-reminders',
      async () => {
        const supabase = createAdminClient()
        const now = new Date()
        let queued = 0

        // Get successful reminders for shifts within 4 hours
        const successfulReminders = results
          .map((r, i) => ({ ...r, ...remindersToSend[i] }))
          .filter((r) => r.success)

        if (successfulReminders.length === 0) return 0

        // Check if any org has voice shift reminders enabled
        // Group by org to avoid redundant checks
        const orgIds = [...new Set(
          successfulReminders.map((r) => r.shift.organization_id),
        )]

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, voice_calls_enabled, voice_shift_reminders, voice_call_hours_start, voice_call_hours_end, voice_monthly_budget')
          .in('id', orgIds)

        const voiceEnabledOrgs = new Set(
          (orgs || [])
            .filter((o) => o.voice_calls_enabled && o.voice_shift_reminders)
            .map((o) => o.id),
        )

        if (voiceEnabledOrgs.size === 0) return 0

        for (const reminder of successfulReminders) {
          const orgId = reminder.shift.organization_id
          if (!voiceEnabledOrgs.has(orgId)) continue

          // Check if shift is within 4 hours
          const shiftDate = new Date(reminder.shift.start_time)
          const hoursUntilShift =
            (shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          if (hoursUntilShift > 4 || hoursUntilShift <= 0) continue

          // Check contact has phone and hasn't opted out
          const { data: contact } = await supabase
            .from('contacts')
            .select('phone, phone_call_opt_out')
            .eq('id', reminder.signup.contact_id)
            .single()

          if (!contact?.phone || contact.phone_call_opt_out) continue

          // Emit voice call event
          await inngest.send({
            name: 'voice/call.initiate',
            data: {
              contactId: reminder.signup.contact_id,
              organizationId: orgId,
              callType: 'shift_reminder' as const,
              triggerEvent: 'volunteer_reminder',
              triggerEventId: reminder.shift.id,
            },
          })

          queued++
        }

        return queued
      },
    )

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return {
      message: `Processed ${remindersToSend.length} reminders`,
      successCount,
      failureCount,
      voiceRemindersQueued,
      results,
    }
  }
)
