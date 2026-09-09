import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { render } from '@react-email/render'
import VolunteerThankYouEmail from '@/lib/email/templates/volunteer-thankyou'

export const sendVolunteerThankYou = inngest.createFunction(
  {
    id: 'send-volunteer-thankyou',
    name: 'Send Post-Shift Thank You Emails',
  },
  { cron: '0 20 * * *' }, // Daily at 8 PM
  async ({ step }) => {
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    )

    // Step 1: Find completed signups for shifts that ended today
    const signupsToThank = await step.run(
      'fetch-completed-signups',
      async () => {
        const supabase = createAdminClient()

        const { data: signups, error } = await supabase
          .from('shift_signups')
          .select(
            `
            *,
            contact:contacts(id, first_name, last_name, email),
            shift:shifts(
              id,
              title,
              start_time,
              end_time,
              location,
              organization_id,
              organization:organizations(id, name, settings)
            )
          `,
          )
          .eq('status', 'completed')
          .eq('thank_you_sent', false)

        if (error) {
          throw new Error(`Failed to fetch signups: ${error.message}`)
        }

        // Filter to only shifts that ended today
        return (signups || []).filter((s) => {
          const endTime = new Date(s.shift?.end_time)
          return endTime >= todayStart && endTime <= todayEnd
        })
      },
    )

    if (signupsToThank.length === 0) {
      return { message: 'No thank-you emails to send', count: 0 }
    }

    // Step 2: Send thank-you emails
    const results = await step.run('send-thankyou-emails', async () => {
      const sendResults = []

      for (const signup of signupsToThank) {
        try {
          if (!signup.contact?.email) {
            sendResults.push({
              signupId: signup.id,
              success: false,
              error: 'No email address',
            })
            continue
          }

          const shift = signup.shift
          const shiftDate = new Date(shift.start_time)

          const formattedDate = shiftDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          const orgName = shift.organization?.name || 'Our Organization'

          const emailHtml = await render(
            VolunteerThankYouEmail({
              volunteerName: signup.contact.first_name,
              orgName,
              shiftTitle: shift.title,
              shiftDate: formattedDate,
              hoursLogged: signup.hours_logged,
            }),
          )

          // Determine from email
          const verifiedFromEmail = 'noreply@flourishnpo.com'
          const orgSettings = shift.organization?.settings as any
          const isVerifiedDomain = (email: string | undefined): boolean => {
            if (!email) return false
            const domain = email.split('@')[1]?.toLowerCase()
            return domain === 'flourishnpo.com'
          }
          const orgFromEmail =
            orgSettings?.email_from || orgSettings?.fromEmail
          let fromEmail = verifiedFromEmail
          if (orgFromEmail && isVerifiedDomain(orgFromEmail)) {
            fromEmail = orgFromEmail
          } else if (
            process.env.RESEND_FROM_EMAIL &&
            isVerifiedDomain(process.env.RESEND_FROM_EMAIL)
          ) {
            fromEmail = process.env.RESEND_FROM_EMAIL
          }

          const result = await sendEmail({
            to: signup.contact.email,
            subject: `Thank you for volunteering: ${shift.title}`,
            body: emailHtml,
            from: fromEmail,
          })

          sendResults.push({
            signupId: signup.id,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          })
        } catch (error) {
          console.error(
            `Error sending thank-you for signup ${signup.id}:`,
            error,
          )
          sendResults.push({
            signupId: signup.id,
            success: false,
            error:
              error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return sendResults
    })

    // Step 3: Mark thank_you_sent for successful emails
    await step.run('update-thankyou-flags', async () => {
      const supabase = createAdminClient()

      const successfulIds = results
        .filter((r) => r.success)
        .map((r) => r.signupId)

      if (successfulIds.length > 0) {
        const { error } = await supabase
          .from('shift_signups')
          .update({ thank_you_sent: true })
          .in('id', successfulIds)

        if (error) {
          console.error('Failed to update thank_you_sent flags:', error)
        }
      }
    })

    // Step 4: Log activities
    await step.run('log-activities', async () => {
      const supabase = createAdminClient()

      const successfulResults = results.filter((r) => r.success)
      if (successfulResults.length === 0) return

      const activities = successfulResults.map((r) => {
        const signup = signupsToThank.find((s) => s.id === r.signupId)!
        return {
          organization_id: signup.shift.organization_id,
          contact_id: signup.contact_id,
          activity_type: 'email_sent',
          description: `Post-shift thank-you sent for: ${signup.shift.title}`,
          metadata: {
            shiftId: signup.shift.id,
            signupId: signup.id,
            emailType: 'volunteer_thankyou',
          },
        }
      })

      await supabase.from('activities').insert(activities)
    })

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return {
      message: `Processed ${signupsToThank.length} thank-you emails`,
      successCount,
      failureCount,
      results,
    }
  },
)
