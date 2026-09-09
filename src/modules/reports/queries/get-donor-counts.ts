'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface DonorCounts {
  total: number
  active: number // gave in last 12 months
  lapsed: number // no gift in 12+ months
  new: number // first gift in last 90 days
  major: number // lifetime >= $1000
}

/**
 * Get donor counts by segment for reports
 */
export async function getDonorCounts(): Promise<DonorCounts> {
  try {
    const supabase = await createClient()

    // In BYPASS_AUTH mode, get org from cookie; otherwise from user membership
    let organizationId: string | null = null

    if (process.env.BYPASS_AUTH === 'true') {
      organizationId = await getCurrentOrganizationId()
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !memberData) {
        throw new Error('Organization not found')
      }

      organizationId = memberData.organization_id
    }

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Calculate date thresholds
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get all contacts marked as donors
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select('id, last_gift_date, total_gifts')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)

    if (donorsError) {
      throw new Error('Failed to fetch donors')
    }

    const total = donors?.length || 0

    // Count active donors (gave in last 12 months)
    const active = donors?.filter(d => {
      if (!d.last_gift_date) return false
      const lastGiftDate = new Date(d.last_gift_date)
      return lastGiftDate >= twelveMonthsAgo
    }).length || 0

    // Count lapsed donors (no gift in 12+ months)
    const lapsed = donors?.filter(d => {
      if (!d.last_gift_date) return true
      const lastGiftDate = new Date(d.last_gift_date)
      return lastGiftDate < twelveMonthsAgo
    }).length || 0

    // Count new donors (single gift in last 90 days)
    const newDonors = donors?.filter(d => {
      if (!d.last_gift_date || (d.total_gifts || 0) > 1) return false
      const lastGiftDate = new Date(d.last_gift_date)
      return lastGiftDate >= ninetyDaysAgo
    }).length || 0

    // Count major donors (lifetime >= $1000)
    const major = donors?.filter(d => {
      return (d.total_gifts || 0) >= 1000
    }).length || 0

    return {
      total,
      active,
      lapsed,
      new: newDonors,
      major,
    }
  } catch (error) {
    console.error('Error fetching donor counts:', error)
    throw error
  }
}
