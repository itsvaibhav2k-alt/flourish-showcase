import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'

export const handleVolunteerSignup = inngest.createFunction(
  {
    id: 'handle-volunteer-signup',
    name: 'Handle Volunteer Signup',
  },
  { event: 'volunteer/signup' },
  async ({ event, step }) => {
    const { signupId, shiftId, contactId, organizationId, status } = event.data

    // Step 1: Fetch signup, contact, and shift details
    const signupData = await step.run('fetch-signup-details', async () => {
      const supabase = createAdminClient()

      const [{ data: signup }, { data: contact }, { data: shift }, { data: org }] =
        await Promise.all([
          supabase.from('shift_signups').select('*').eq('id', signupId).single(),
          supabase.from('contacts').select('*').eq('id', contactId).single(),
          supabase.from('shifts').select('*').eq('id', shiftId).single(),
          supabase
            .from('organizations')
            .select('*, auto_volunteer_confirmations')
            .eq('id', organizationId)
            .single(),
        ])

      if (!signup || !contact || !shift || !org) {
        throw new Error('Failed to fetch signup, contact, shift, or organization data')
      }

      return { signup, contact, shift, org }
    })

    // Step 2: Check if confirmations are enabled
    const shouldSendConfirmation = signupData.org.auto_volunteer_confirmations ?? true

    if (!shouldSendConfirmation) {
      return {
        signupId,
        status,
        emailSent: false,
        skipped: true,
        reason: 'Volunteer confirmations are disabled for this organization',
      }
    }

    // Step 3: Send confirmation email (only for confirmed signups, not waitlisted)
    if (status === 'confirmed') {
      await step.run('send-confirmation-email', async () => {
        const { contact, shift, org } = signupData

        if (!contact.email) {
          console.error(`No email address for contact ${contactId}`)
          return
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

        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank you for signing up to volunteer!</h2>

            <p>Hi ${contact.first_name},</p>

            <p>We're excited to confirm your volunteer shift with ${org.name}:</p>

            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${shift.title}</h3>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${formattedTime}</p>
              ${shift.location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${shift.location}</p>` : ''}
              ${shift.description ? `<p style="margin: 8px 0;"><strong>Details:</strong> ${shift.description}</p>` : ''}
            </div>

            <p>We'll send you reminders as the date approaches. If you need to cancel, please let us know as soon as possible.</p>

            <p>Thank you for your support!</p>

            <p>Best regards,<br>${org.name}</p>
          </div>
        `

        // Always use verified domain - Resend requires domain verification
        const verifiedFromEmail = 'noreply@flourishnpo.com'
        const orgSettings = org.settings as any

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

        await sendEmail({
          to: contact.email,
          subject: `Volunteer Shift Confirmed: ${shift.title}`,
          body: emailBody,
          from: fromEmail,
        })
      })

      // Step 4: Mark confirmation as sent
      await step.run('mark-confirmation-sent', async () => {
        const supabase = createAdminClient()

        await supabase
          .from('shift_signups')
          .update({ confirmation_sent: true })
          .eq('id', signupId)
      })
    }

    // Step 5: Send waitlist notification if waitlisted
    if (status === 'waitlisted') {
      await step.run('send-waitlist-notification', async () => {
        const { contact, shift, org } = signupData

        if (!contact.email) {
          console.error(`No email address for contact ${contactId}`)
          return
        }

        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been added to the waitlist</h2>

            <p>Hi ${contact.first_name},</p>

            <p>Thank you for your interest in volunteering with ${org.name}!</p>

            <p>The following shift is currently full, but we've added you to the waitlist:</p>

            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${shift.title}</h3>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(shift.start_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>

            <p>If a spot opens up, we'll notify you right away. In the meantime, please check our volunteer page for other opportunities.</p>

            <p>Thank you for your support!</p>

            <p>Best regards,<br>${org.name}</p>
          </div>
        `

        // Always use verified domain - Resend requires domain verification
        const verifiedFromEmail = 'noreply@flourishnpo.com'
        const orgSettings = org.settings as any

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

        await sendEmail({
          to: contact.email,
          subject: `Waitlisted: ${shift.title}`,
          body: emailBody,
          from: fromEmail,
        })
      })
    }

    // Step 6: Log activity
    await step.run('log-activity', async () => {
      const supabase = createAdminClient()
      const { shift } = signupData

      await supabase.from('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        activity_type: 'email_sent',
        description: `Volunteer signup ${status === 'confirmed' ? 'confirmation' : 'waitlist notification'} sent for: ${shift.title}`,
        metadata: {
          signupId,
          shiftId,
          status,
        },
      })
    })

    return {
      signupId,
      status,
      emailSent: true,
    }
  }
)
