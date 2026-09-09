import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'

export const handleVolunteerCheckin = inngest.createFunction(
  {
    id: 'handle-volunteer-checkin',
    name: 'Handle Volunteer Check-in',
  },
  { event: 'volunteer/checkin' },
  async ({ event, step }) => {
    const { signupId, shiftId, contactId, organizationId, hoursLogged } = event.data

    // Step 1: Update contact volunteer statistics
    const volunteerStats = await step.run(
      'recalculate-volunteer-stats',
      async () => {
        const supabase = createAdminClient()

        // Get all checked-in signups for this contact
        const { data: signups, error: signupsError } = await supabase
          .from('shift_signups')
          .select('hours_logged, no_show, status, checked_in_at')
          .eq('contact_id', contactId)
          .not('checked_in_at', 'is', null)

        if (signupsError) {
          throw new Error(`Failed to fetch signups: ${signupsError.message}`)
        }

        if (!signups || signups.length === 0) {
          return {
            totalVolunteerHours: hoursLogged || 0,
            totalShifts: 1,
            noShowCount: 0,
            reliabilityScore: 1.0,
          }
        }

        const totalVolunteerHours = signups.reduce(
          (sum, signup) => sum + Number(signup.hours_logged || 0),
          0
        )

        const totalShifts = signups.length
        const noShowCount = signups.filter((s) => s.no_show).length

        // Calculate reliability score (completed without no-show / total)
        const reliabilityScore =
          totalShifts > 0
            ? Math.round((totalShifts - noShowCount) / totalShifts * 100) / 100
            : 1.0

        return {
          totalVolunteerHours,
          totalShifts,
          noShowCount,
          reliabilityScore,
        }
      }
    )

    // Step 2: Update contact record
    await step.run('update-contact-record', async () => {
      const supabase = createAdminClient()

      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          is_volunteer: true,
          total_volunteer_hours: volunteerStats.totalVolunteerHours,
          reliability_score: volunteerStats.reliabilityScore,
        })
        .eq('id', contactId)

      if (updateError) {
        throw new Error(`Failed to update contact: ${updateError.message}`)
      }
    })

    // Step 3: Log activity
    await step.run('log-activity', async () => {
      const supabase = createAdminClient()

      // Get shift details for activity log
      const { data: shift } = await supabase
        .from('shifts')
        .select('title')
        .eq('id', shiftId)
        .single()

      await supabase.from('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        activity_type: 'volunteer_checkin',
        description: `Volunteer checked in for shift: ${shift?.title || 'Unknown'} (${hoursLogged || 0} hours)`,
        metadata: {
          signupId,
          shiftId,
          hoursLogged,
          volunteerStats,
        },
      })
    })

    return {
      contactId,
      signupId,
      volunteerStats,
    }
  }
)
