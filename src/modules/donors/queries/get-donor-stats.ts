'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { calculateLapseRisk } from '../services/lapse-risk-calculator'

export interface DonorStats {
  totalDonors: number
  totalRaisedYTD: number
  atRiskCount: number
  newDonorsThisMonth: number
}

/**
 * Server function to get donor dashboard statistics
 */
export async function getDonorStats(): Promise<DonorStats> {
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

    // Get total donors count (excluding archived)
    const { count: totalDonors, error: donorsError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (donorsError) {
      throw new Error('Failed to fetch donor count')
    }

    // Get total raised YTD
    const currentYear = new Date().getFullYear()
    const yearStart = `${currentYear}-01-01`
    const { data: ytdGifts, error: ytdError } = await supabase
      .from('gifts')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('gift_date', yearStart)

    if (ytdError) {
      throw new Error('Failed to fetch YTD gifts')
    }

    const totalRaisedYTD = ytdGifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0

    // Get new donors this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get all donors and their first gift dates to determine new donors (excluding archived)
    const { data: allDonors, error: allDonorsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (allDonorsError) {
      throw new Error('Failed to fetch donors')
    }

    let newDonorsThisMonth = 0
    let atRiskCount = 0

    // Check each donor's first gift and lapse risk
    await Promise.all(
      (allDonors || []).map(async (donor) => {
        const { data: gifts, error: giftsError } = await supabase
          .from('gifts')
          .select('gift_date, amount')
          .eq('contact_id', donor.id)
          .order('gift_date', { ascending: true })

        if (!giftsError && gifts && gifts.length > 0) {
          const firstGiftDate = gifts[0].gift_date
          if (firstGiftDate >= monthStart) {
            newDonorsThisMonth++
          }

          // Calculate lapse risk
          const lastGiftDate = gifts[gifts.length - 1].gift_date

          // Calculate average gap
          let avgGiftGap: number | null = null
          if (gifts.length > 1) {
            const gaps = []
            for (let i = 1; i < gifts.length; i++) {
              const prevDate = new Date(gifts[i - 1].gift_date)
              const currDate = new Date(gifts[i].gift_date)
              const gapDays = Math.floor(
                (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
              )
              gaps.push(gapDays)
            }
            avgGiftGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
          }

          const lapseRisk = calculateLapseRisk({
            giftCount: gifts.length,
            lastGiftDate: new Date(lastGiftDate),
            avgGiftGap,
          })

          if (lapseRisk === 'high' || lapseRisk === 'medium') {
            atRiskCount++
          }
        }
      })
    )

    return {
      totalDonors: totalDonors || 0,
      totalRaisedYTD,
      atRiskCount,
      newDonorsThisMonth,
    }
  } catch (error) {
    console.error('Error fetching donor stats:', error)
    throw error
  }
}
