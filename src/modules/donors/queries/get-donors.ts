'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export type DonorSegment = 'all' | 'new' | 'active' | 'lapsed' | 'major'

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

export interface DonorWithStats {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  lifetime_giving: number
  gift_count: number
  first_gift_date: string | null
  last_gift_date: string | null
  avg_gift_amount: number
  avg_gift_gap_days: number | null
  segment: DonorSegment
}

export interface GetDonorsOptions {
  segment?: DonorSegment
  page?: number
  limit?: number
  sortBy?: 'name' | 'lifetime_giving' | 'last_gift_date'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Determines the donor segment based on giving behavior
 */
function calculateDonorSegment(
  lifetimeGiving: number,
  giftCount: number,
  lastGiftDate: string | null,
  avgGiftGapDays: number | null
): DonorSegment {
  const daysSinceLastGift = lastGiftDate
    ? Math.floor((Date.now() - new Date(lastGiftDate).getTime()) / (1000 * 60 * 60 * 24))
    : Infinity

  if (lifetimeGiving >= 10000) {
    return 'major'
  } else if (giftCount === 1) {
    return 'new'
  } else if (daysSinceLastGift > 365) {
    return 'lapsed'
  } else if (avgGiftGapDays && daysSinceLastGift > avgGiftGapDays * 2) {
    return 'lapsed'
  }
  return 'active'
}

/**
 * Server function to fetch donors (contacts where is_donor = true)
 * Includes aggregated giving stats and supports filtering by segment
 *
 * PERFORMANCE: Uses 2 queries instead of N+1:
 * 1. Fetch all donors with pre-computed stats from contacts table
 *    (lifetime_giving, total_gifts, last_gift_date are updated via DB triggers)
 * 2. Fetch first_gift_date and avg_gift_gap_days for all donors in one batch query
 */
export async function getDonors(options: GetDonorsOptions = {}) {
  const {
    segment = 'all',
    page = 1,
    limit = 50,
    sortBy = 'lifetime_giving',
    sortOrder = 'desc',
  } = options

  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId(supabase)

    if (!organizationId) {
      return {
        donors: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    // Query 1: Fetch donors with pre-computed stats from contacts table
    // The contacts table has lifetime_giving, total_gifts, and last_gift_date
    // which are updated automatically via database triggers when gifts are added/updated
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        lifetime_giving,
        total_gifts,
        last_gift_date
      `)
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (donorsError) {
      throw new Error('Failed to fetch donors')
    }

    if (!donors || donors.length === 0) {
      return {
        donors: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    // Query 2: Fetch all gifts for all donors in ONE batch query
    // This eliminates the N+1 problem - instead of 1000 queries for 1000 donors,
    // we make just 1 additional query regardless of donor count
    const donorIds = donors.map((d) => d.id)

    const { data: allGifts } = await supabase
      .from('gifts')
      .select('contact_id, gift_date')
      .in('contact_id', donorIds)
      .order('gift_date', { ascending: true })

    // Build a map of donor stats from the batched gift data
    const giftStatsMap = new Map<
      string,
      { first_gift_date: string | null; avg_gift_gap_days: number | null }
    >()

    if (allGifts && allGifts.length > 0) {
      // Group gifts by contact_id
      const giftsByContact = new Map<string, string[]>()
      for (const gift of allGifts) {
        const existing = giftsByContact.get(gift.contact_id) || []
        existing.push(gift.gift_date)
        giftsByContact.set(gift.contact_id, existing)
      }

      // Calculate first_gift_date and avg_gift_gap_days for each donor
      for (const [contactId, giftDates] of giftsByContact) {
        const firstGiftDate = giftDates[0] || null
        let avgGiftGapDays: number | null = null

        if (giftDates.length > 1) {
          const gaps: number[] = []
          for (let i = 1; i < giftDates.length; i++) {
            const prevDate = new Date(giftDates[i - 1])
            const currDate = new Date(giftDates[i])
            const gapDays = Math.floor(
              (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            gaps.push(gapDays)
          }
          avgGiftGapDays = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
        }

        giftStatsMap.set(contactId, {
          first_gift_date: firstGiftDate,
          avg_gift_gap_days: avgGiftGapDays,
        })
      }
    }

    // Combine donor data with gift aggregations
    const donorsWithStats: DonorWithStats[] = donors.map((donor) => {
      const lifetimeGiving = Number(donor.lifetime_giving) || 0
      const giftCount = donor.total_gifts || 0
      const lastGiftDate = donor.last_gift_date || null
      const giftStats = giftStatsMap.get(donor.id)
      const firstGiftDate = giftStats?.first_gift_date || null
      const avgGiftGapDays = giftStats?.avg_gift_gap_days || null
      const avgGiftAmount = giftCount > 0 ? lifetimeGiving / giftCount : 0

      const donorSegment = calculateDonorSegment(
        lifetimeGiving,
        giftCount,
        lastGiftDate,
        avgGiftGapDays
      )

      return {
        id: donor.id,
        first_name: donor.first_name,
        last_name: donor.last_name,
        email: donor.email,
        phone: donor.phone,
        lifetime_giving: lifetimeGiving,
        gift_count: giftCount,
        first_gift_date: firstGiftDate,
        last_gift_date: lastGiftDate,
        avg_gift_amount: avgGiftAmount,
        avg_gift_gap_days: avgGiftGapDays,
        segment: donorSegment,
      }
    })

    // Filter by segment if specified
    let filteredDonors = donorsWithStats
    if (segment !== 'all') {
      filteredDonors = donorsWithStats.filter((d) => d.segment === segment)
    }

    // Sort
    if (sortBy === 'lifetime_giving') {
      filteredDonors.sort((a, b) =>
        sortOrder === 'asc'
          ? a.lifetime_giving - b.lifetime_giving
          : b.lifetime_giving - a.lifetime_giving
      )
    } else if (sortBy === 'last_gift_date') {
      filteredDonors.sort((a, b) => {
        if (!a.last_gift_date) return 1
        if (!b.last_gift_date) return -1
        const dateA = new Date(a.last_gift_date).getTime()
        const dateB = new Date(b.last_gift_date).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    } else if (sortBy === 'name') {
      filteredDonors.sort((a, b) => {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
    }

    // Paginate
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedDonors = filteredDonors.slice(start, end)

    return {
      donors: paginatedDonors,
      total: filteredDonors.length,
      page,
      limit,
      totalPages: Math.ceil(filteredDonors.length / limit),
    }
  } catch (error) {
    console.error('Error fetching donors:', error)
    throw error
  }
}
