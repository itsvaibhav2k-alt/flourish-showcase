import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Calculate lapse risk for a donor based on their giving history
 * @param lastGiftDate Date of last gift
 * @param averageGiftInterval Average days between gifts
 * @param totalGifts Total number of gifts
 * @returns Lapse risk level: low, medium, or high
 */
function calculateLapseRisk(
  lastGiftDate: string | null,
  averageGiftInterval: number | null,
  totalGifts: number
): 'low' | 'medium' | 'high' | null {
  if (!lastGiftDate || totalGifts === 0) {
    return null
  }

  const daysSinceLastGift = Math.floor(
    (Date.now() - new Date(lastGiftDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  // New donors (1-2 gifts) - use standard thresholds
  if (totalGifts <= 2) {
    if (daysSinceLastGift < 180) return 'low' // Less than 6 months
    if (daysSinceLastGift < 365) return 'medium' // 6-12 months
    return 'high' // Over 1 year
  }

  // Established donors - use their average giving interval
  const avgInterval = averageGiftInterval || 365

  // Risk based on multiple of their average interval
  if (daysSinceLastGift < avgInterval * 1.5) {
    return 'low' // Within normal giving pattern
  } else if (daysSinceLastGift < avgInterval * 2.5) {
    return 'medium' // Moderately overdue
  } else {
    return 'high' // Significantly overdue
  }
}

export const calculateLapseRiskJob = inngest.createFunction(
  {
    id: 'calculate-lapse-risk',
    name: 'Calculate Donor Lapse Risk',
  },
  { cron: '0 6 * * *' }, // Daily at 6 AM
  async ({ step }) => {
    // Step 1: Get all organizations
    const organizations = await step.run('fetch-organizations', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')

      if (error) {
        throw new Error(`Failed to fetch organizations: ${error.message}`)
      }

      return data || []
    })

    const totalUpdated = await step.run(
      'calculate-and-update-lapse-risk',
      async () => {
        const supabase = createAdminClient()
        let updatedCount = 0

        for (const org of organizations) {
          // Get all donors for this organization
          const { data: donors, error: donorsError } = await supabase
            .from('contacts')
            .select('id, last_gift_date, total_gifts, lifetime_giving')
            .eq('organization_id', org.id)
            .eq('is_donor', true)
            .gt('total_gifts', 0)

          if (donorsError) {
            console.error(
              `Error fetching donors for org ${org.id}:`,
              donorsError
            )
            continue
          }

          if (!donors || donors.length === 0) continue

          // Calculate lapse risk for each donor
          for (const donor of donors) {
            // Get gift history to calculate average interval
            const { data: gifts } = await supabase
              .from('gifts')
              .select('gift_date, amount')
              .eq('contact_id', donor.id)
              .order('gift_date', { ascending: true })

            let averageInterval: number | null = null

            if (gifts && gifts.length > 1) {
              // Calculate average days between gifts
              const intervals: number[] = []
              for (let i = 1; i < gifts.length; i++) {
                const prevDate = new Date(gifts[i - 1].gift_date)
                const currDate = new Date(gifts[i].gift_date)
                const daysBetween = Math.floor(
                  (currDate.getTime() - prevDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                intervals.push(daysBetween)
              }

              averageInterval =
                intervals.reduce((a, b) => a + b, 0) / intervals.length
            }

            const lapseRisk = calculateLapseRisk(
              donor.last_gift_date,
              averageInterval,
              donor.total_gifts ?? 0
            )

            // Update contact with lapse risk
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                lapse_risk: lapseRisk,
              })
              .eq('id', donor.id)

            if (updateError) {
              console.error(
                `Error updating lapse risk for contact ${donor.id}:`,
                updateError
              )
            } else {
              updatedCount++
            }
          }
        }

        return updatedCount
      }
    )

    return {
      message: 'Lapse risk calculation completed',
      organizationsProcessed: organizations.length,
      contactsUpdated: totalUpdated,
    }
  }
)
