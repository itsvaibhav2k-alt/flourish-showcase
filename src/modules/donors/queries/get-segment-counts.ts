'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { DonorSegment } from './get-donors'

export interface SegmentCount {
  id: DonorSegment
  name: string
  count: number
}

/**
 * Helper to get organization ID consistently
 * In BYPASS_AUTH mode: uses cookie/demo org
 * In production: fetches from user's organization membership
 */
async function getOrganizationId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return getCurrentOrganizationId()
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }

  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !memberData) {
    return null
  }

  return memberData.organization_id
}

/**
 * Server function to get donor counts by segment
 * Used for segment filter pills display
 */
export async function getSegmentCounts(): Promise<SegmentCount[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId(supabase)

    if (!organizationId) {
      return []
    }

    // Fetch all donors with basic info (excluding archived)
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (donorsError || !donors) {
      return []
    }

    // Count donors by segment
    const segmentCounts: Record<DonorSegment, number> = {
      all: 0,
      active: 0,
      new: 0,
      lapsed: 0,
      major: 0,
    }

    // For each donor, determine their segment and count
    await Promise.all(
      donors.map(async (donor) => {
        const { data: gifts } = await supabase
          .from('gifts')
          .select('amount, gift_date')
          .eq('contact_id', donor.id)
          .order('gift_date', { ascending: true })

        const giftCount = gifts?.length || 0
        const lifetimeGiving = gifts?.reduce((sum, g) => sum + g.amount, 0) || 0
        const lastGiftDate = gifts?.[giftCount - 1]?.gift_date || null

        // Calculate average gap between gifts
        let avgGiftGapDays: number | null = null
        if (gifts && gifts.length > 1) {
          const gaps = []
          for (let i = 1; i < gifts.length; i++) {
            const prevDate = new Date(gifts[i - 1].gift_date)
            const currDate = new Date(gifts[i].gift_date)
            const gapDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
            gaps.push(gapDays)
          }
          avgGiftGapDays = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
        }

        // Determine segment
        const daysSinceLastGift = lastGiftDate
          ? Math.floor((Date.now() - new Date(lastGiftDate).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        let donorSegment: DonorSegment = 'active'

        if (lifetimeGiving >= 10000) {
          donorSegment = 'major'
        } else if (giftCount === 1) {
          donorSegment = 'new'
        } else if (daysSinceLastGift > 365) {
          donorSegment = 'lapsed'
        } else if (avgGiftGapDays && daysSinceLastGift > avgGiftGapDays * 2) {
          donorSegment = 'lapsed'
        }

        segmentCounts[donorSegment]++
      })
    )

    // Map to segment options format
    return [
      { id: 'active', name: 'Active', count: segmentCounts.active },
      { id: 'new', name: 'New', count: segmentCounts.new },
      { id: 'lapsed', name: 'At Risk', count: segmentCounts.lapsed },
      { id: 'major', name: 'Major', count: segmentCounts.major },
    ]
  } catch (error) {
    console.error('Error fetching segment counts:', error)
    return []
  }
}
