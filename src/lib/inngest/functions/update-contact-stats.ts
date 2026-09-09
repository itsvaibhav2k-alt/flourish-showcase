import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'

export const updateContactStats = inngest.createFunction(
  {
    id: 'update-contact-stats',
    name: 'Update Contact Statistics',
  },
  { event: 'gift/created' },
  async ({ event, step }) => {
    const { contactId, organizationId } = event.data

    // Step 1: Recalculate donor statistics
    const donorStats = await step.run('recalculate-donor-stats', async () => {
      const supabase = createAdminClient()

      // Get all gifts for this contact
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('amount, gift_date')
        .eq('contact_id', contactId)
        .order('gift_date', { ascending: false })

      if (giftsError) {
        throw new Error(`Failed to fetch gifts: ${giftsError.message}`)
      }

      if (!gifts || gifts.length === 0) {
        return {
          lifetimeGiving: 0,
          totalGifts: 0,
          lastGiftDate: null,
        }
      }

      const lifetimeGiving = gifts.reduce(
        (sum, gift) => sum + Number(gift.amount),
        0
      )
      const totalGifts = gifts.length
      const lastGiftDate = gifts[0].gift_date

      return {
        lifetimeGiving,
        totalGifts,
        lastGiftDate,
      }
    })

    // Step 2: Recalculate volunteer statistics
    const volunteerStats = await step.run(
      'recalculate-volunteer-stats',
      async () => {
        const supabase = createAdminClient()

        // Get all completed shift signups for this contact
        const { data: signups, error: signupsError } = await supabase
          .from('shift_signups')
          .select('hours_logged, no_show, status')
          .eq('contact_id', contactId)
          .eq('status', 'completed')

        if (signupsError) {
          console.error('Error fetching signups:', signupsError)
          return null
        }

        if (!signups || signups.length === 0) {
          return null
        }

        const totalVolunteerHours = signups.reduce(
          (sum, signup) => sum + Number(signup.hours_logged || 0),
          0
        )

        const totalSignups = signups.length
        const noShowCount = signups.filter((s) => s.no_show).length

        // Calculate reliability score (completed without no-show / total completed)
        const reliabilityScore =
          totalSignups > 0
            ? Math.min(1.0, (totalSignups - noShowCount) / totalSignups)
            : 1.0

        return {
          totalVolunteerHours,
          reliabilityScore,
        }
      }
    )

    // Step 3: Update contact record
    await step.run('update-contact-record', async () => {
      const supabase = createAdminClient()

      const updateData: any = {
        is_donor: donorStats.totalGifts > 0,
        lifetime_giving: donorStats.lifetimeGiving,
        total_gifts: donorStats.totalGifts,
        last_gift_date: donorStats.lastGiftDate,
      }

      // Add volunteer stats if available
      if (volunteerStats) {
        updateData.is_volunteer = true
        updateData.total_volunteer_hours = volunteerStats.totalVolunteerHours
        updateData.reliability_score = volunteerStats.reliabilityScore
      }

      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)

      if (updateError) {
        throw new Error(`Failed to update contact: ${updateError.message}`)
      }
    })

    // Step 4: Recalculate lapse risk immediately after gift
    const lapseRisk = await step.run('recalculate-lapse-risk', async () => {
      const supabase = createAdminClient()

      if (donorStats.totalGifts === 0 || !donorStats.lastGiftDate) {
        return null
      }

      // Get gift dates to calculate average interval
      const { data: gifts } = await supabase
        .from('gifts')
        .select('gift_date')
        .eq('contact_id', contactId)
        .order('gift_date', { ascending: true })

      let averageInterval: number | null = null
      if (gifts && gifts.length > 1) {
        const intervals: number[] = []
        for (let i = 1; i < gifts.length; i++) {
          const prev = new Date(gifts[i - 1].gift_date)
          const curr = new Date(gifts[i].gift_date)
          intervals.push(Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)))
        }
        averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      }

      const daysSinceLastGift = Math.floor(
        (Date.now() - new Date(donorStats.lastGiftDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      let risk: 'low' | 'medium' | 'high' | null = null
      if (donorStats.totalGifts <= 2) {
        if (daysSinceLastGift < 180) risk = 'low'
        else if (daysSinceLastGift < 365) risk = 'medium'
        else risk = 'high'
      } else {
        const avgInterval = averageInterval || 365
        if (daysSinceLastGift < avgInterval * 1.5) risk = 'low'
        else if (daysSinceLastGift < avgInterval * 2.5) risk = 'medium'
        else risk = 'high'
      }

      await supabase
        .from('contacts')
        .update({ lapse_risk: risk })
        .eq('id', contactId)

      return risk
    })

    // Step 5: Log activity
    await step.run('log-activity', async () => {
      const supabase = createAdminClient()

      await supabase.from('activities').insert({
        organization_id: organizationId,
        contact_id: contactId,
        activity_type: 'contact_updated',
        description: 'Contact statistics updated',
        metadata: {
          donorStats,
          volunteerStats,
          lapseRisk,
        },
      })
    })

    return {
      contactId,
      donorStats,
      volunteerStats,
      lapseRisk,
    }
  }
)
