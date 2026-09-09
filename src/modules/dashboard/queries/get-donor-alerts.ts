'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface DonorAlert {
  id: string
  firstName: string
  lastName: string
  email: string | null
  alertType: 'lapsed' | 'at-risk' | 'major-donor'
  alertMessage: string
  lastGiftDate: string | null
  lifetimeGiving: number
  daysSinceLastGift: number | null
  lapseRisk: 'low' | 'medium' | 'high' | null
}

export interface GetDonorAlertsOptions {
  limit?: number
  includeAtRisk?: boolean
  includeLapsed?: boolean
  includeMajorDonors?: boolean
}

/**
 * Get donor alerts for the dashboard
 * Shows lapsed donors, at-risk donors, and major donor activity
 */
export async function getDonorAlerts(
  options: GetDonorAlertsOptions = {}
): Promise<DonorAlert[]> {
  const {
    limit = 10,
    includeAtRisk = true,
    includeLapsed = true,
    includeMajorDonors = true,
  } = options

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()
    const alerts: DonorAlert[] = []

    // Get donors with lapse risk data
    const { data: donors, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, last_gift_date, lifetime_giving, lapse_risk')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .not('last_gift_date', 'is', null)
      .order('last_gift_date', { ascending: true })

    if (error) {
      console.error('Error fetching donors:', error)
      throw new Error(error.message)
    }

    const now = new Date()

    // Process each donor and create alerts
    for (const donor of donors || []) {
      const lastGiftDate = donor.last_gift_date ? new Date(donor.last_gift_date) : null
      const daysSinceLastGift = lastGiftDate
        ? Math.floor((now.getTime() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Cast lapse risk to the expected type
      const lapseRisk = donor.lapse_risk as 'low' | 'medium' | 'high' | null

      // Lapsed donors (no gift in 365+ days)
      if (includeLapsed && daysSinceLastGift && daysSinceLastGift > 365) {
        alerts.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          alertType: 'lapsed',
          alertMessage: `No gift in ${daysSinceLastGift} days`,
          lastGiftDate: donor.last_gift_date,
          lifetimeGiving: parseFloat(donor.lifetime_giving?.toString() || '0'),
          daysSinceLastGift,
          lapseRisk,
        })
      }
      // At-risk donors (high or medium lapse risk but not yet lapsed)
      else if (
        includeAtRisk &&
        (lapseRisk === 'high' || lapseRisk === 'medium') &&
        daysSinceLastGift &&
        daysSinceLastGift <= 365
      ) {
        alerts.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          alertType: 'at-risk',
          alertMessage: `${lapseRisk === 'high' ? 'High' : 'Medium'} lapse risk`,
          lastGiftDate: donor.last_gift_date,
          lifetimeGiving: parseFloat(donor.lifetime_giving?.toString() || '0'),
          daysSinceLastGift,
          lapseRisk,
        })
      }
      // Major donors who haven't given in 90+ days
      else if (
        includeMajorDonors &&
        parseFloat(donor.lifetime_giving?.toString() || '0') >= 10000 &&
        daysSinceLastGift &&
        daysSinceLastGift >= 90
      ) {
        alerts.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          alertType: 'major-donor',
          alertMessage: `Major donor - last gift ${daysSinceLastGift} days ago`,
          lastGiftDate: donor.last_gift_date,
          lifetimeGiving: parseFloat(donor.lifetime_giving?.toString() || '0'),
          daysSinceLastGift,
          lapseRisk,
        })
      }

      // Stop if we've reached the limit
      if (alerts.length >= limit) {
        break
      }
    }

    // Sort alerts by priority: lapsed > at-risk > major-donor
    alerts.sort((a, b) => {
      const priorityMap = { lapsed: 3, 'at-risk': 2, 'major-donor': 1 }
      return priorityMap[b.alertType] - priorityMap[a.alertType]
    })

    return alerts.slice(0, limit)
  } catch (error) {
    console.error('Error in getDonorAlerts:', error)
    throw error
  }
}
