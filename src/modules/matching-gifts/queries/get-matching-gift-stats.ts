'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { MatchingGiftSummary, MatchEligibleGift } from '../schemas/matching-gift.schema'

/**
 * Get matching gift summary statistics for the organization
 */
export async function getMatchingGiftStats(): Promise<MatchingGiftSummary> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        totalPotential: 0,
        totalSubmitted: 0,
        totalReceived: 0,
        potentialDonors: 0,
        submittedDonors: 0,
        receivedDonors: 0,
        captureRate: 0,
      }
    }

    const supabase = await createClient()

    // Get gifts with matching gift data
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('amount, matching_gift_eligible, matching_gift_status, matching_gift_amount, matching_gift_ratio, contact_id')
      .eq('organization_id', organizationId)
      .eq('matching_gift_eligible', true)

    if (error || !gifts) {
      console.error('Error fetching matching gift stats:', error)
      return {
        totalPotential: 0,
        totalSubmitted: 0,
        totalReceived: 0,
        potentialDonors: 0,
        submittedDonors: 0,
        receivedDonors: 0,
        captureRate: 0,
      }
    }

    // Calculate stats
    let totalPotential = 0
    let totalSubmitted = 0
    let totalReceived = 0
    const potentialDonorIds = new Set<string>()
    const submittedDonorIds = new Set<string>()
    const receivedDonorIds = new Set<string>()

    for (const gift of gifts) {
      const ratio = gift.matching_gift_ratio || 1
      const potentialMatch = Number(gift.amount) * ratio

      switch (gift.matching_gift_status) {
        case 'eligible':
        case 'unknown':
          totalPotential += potentialMatch
          potentialDonorIds.add(gift.contact_id)
          break
        case 'submitted':
          totalSubmitted += potentialMatch
          submittedDonorIds.add(gift.contact_id)
          break
        case 'received':
          totalReceived += gift.matching_gift_amount || potentialMatch
          receivedDonorIds.add(gift.contact_id)
          break
      }
    }

    const totalEligible = totalPotential + totalSubmitted + totalReceived
    const captureRate = totalEligible > 0 ? (totalReceived / totalEligible) * 100 : 0

    return {
      totalPotential,
      totalSubmitted,
      totalReceived,
      potentialDonors: potentialDonorIds.size,
      submittedDonors: submittedDonorIds.size,
      receivedDonors: receivedDonorIds.size,
      captureRate: Math.round(captureRate),
    }
  } catch (error) {
    console.error('Error in getMatchingGiftStats:', error)
    return {
      totalPotential: 0,
      totalSubmitted: 0,
      totalReceived: 0,
      potentialDonors: 0,
      submittedDonors: 0,
      receivedDonors: 0,
      captureRate: 0,
    }
  }
}

/**
 * Get list of match-eligible gifts
 */
export async function getMatchEligibleGifts(
  status?: 'eligible' | 'submitted' | 'received' | 'all'
): Promise<MatchEligibleGift[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()

    let query = supabase
      .from('gifts')
      .select(`
        id,
        contact_id,
        amount,
        gift_date,
        employer_name,
        matching_gift_ratio,
        matching_gift_status,
        matching_gift_amount,
        contacts (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('matching_gift_eligible', true)
      .order('gift_date', { ascending: false })

    // Filter by status if specified
    if (status && status !== 'all') {
      if (status === 'eligible') {
        query = query.in('matching_gift_status', ['eligible', 'unknown'])
      } else {
        query = query.eq('matching_gift_status', status)
      }
    }

    const { data: gifts, error } = await query.limit(100)

    if (error || !gifts) {
      console.error('Error fetching match-eligible gifts:', error)
      return []
    }

    return gifts.map((gift: any) => ({
      id: gift.id,
      contactId: gift.contact_id,
      contactName: `${gift.contacts?.first_name || ''} ${gift.contacts?.last_name || ''}`.trim(),
      contactEmail: gift.contacts?.email || null,
      amount: Number(gift.amount),
      giftDate: gift.gift_date,
      employerName: gift.employer_name || 'Unknown',
      matchRatio: gift.matching_gift_ratio,
      status: gift.matching_gift_status || 'unknown',
      potentialMatch: gift.matching_gift_amount || (Number(gift.amount) * (gift.matching_gift_ratio || 1)),
    }))
  } catch (error) {
    console.error('Error in getMatchEligibleGifts:', error)
    return []
  }
}
