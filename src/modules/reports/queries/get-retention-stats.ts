'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface RetentionStats {
  lybuntCount: number
  lybuntValue: number
  sybuntCount: number
  sybuntValue: number
  retentionRate: number
  reactivationRate: number
  averageDonorLifespan: number
  currentYearDonors: number
  lastYearDonors: number
  newDonorsThisYear: number
  retainedDonors: number
}

export interface LybuntContact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  lastGiftDate: string
  lastGiftAmount: number
  lifetimeGiving: number
  totalGifts: number
  daysSinceLastGift: number
}

/**
 * Get LYBUNT/SYBUNT retention statistics
 */
export async function getRetentionStats(): Promise<RetentionStats> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return getEmptyStats()
    }

    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    // Get all gifts grouped by contact and year
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('contact_id, amount, gift_date')
      .eq('organization_id', organizationId)

    if (error || !gifts) {
      console.error('Error fetching gifts for retention:', error)
      return getEmptyStats()
    }

    // Build contact giving history by year
    const contactYearGiving = new Map<string, Map<number, number>>()

    for (const gift of gifts) {
      const year = new Date(gift.gift_date).getFullYear()
      if (!contactYearGiving.has(gift.contact_id)) {
        contactYearGiving.set(gift.contact_id, new Map())
      }
      const yearMap = contactYearGiving.get(gift.contact_id)!
      yearMap.set(year, (yearMap.get(year) || 0) + Number(gift.amount))
    }

    // Calculate metrics
    let lybuntCount = 0
    let lybuntValue = 0
    let sybuntCount = 0
    let sybuntValue = 0
    let currentYearDonors = 0
    let lastYearDonors = 0
    let retainedDonors = 0
    let reactivatedDonors = 0

    for (const [contactId, yearMap] of contactYearGiving) {
      const gaveThisYear = yearMap.has(currentYear)
      const gaveLastYear = yearMap.has(lastYear)
      const gaveBeforeLastYear = Array.from(yearMap.keys()).some(y => y < lastYear)

      if (gaveThisYear) {
        currentYearDonors++
        if (gaveLastYear) {
          retainedDonors++
        } else if (gaveBeforeLastYear) {
          reactivatedDonors++
        }
      }

      if (gaveLastYear) {
        lastYearDonors++
        if (!gaveThisYear) {
          // LYBUNT: Gave last year but not this year
          lybuntCount++
          lybuntValue += yearMap.get(lastYear) || 0
        }
      }

      if (!gaveThisYear && !gaveLastYear && gaveBeforeLastYear) {
        // SYBUNT: Gave in some prior year but not last year or this year
        sybuntCount++
        const priorYearGiving = Array.from(yearMap.entries())
          .filter(([y]) => y < lastYear)
          .reduce((sum, [, amt]) => sum + amt, 0) / Array.from(yearMap.keys()).filter(y => y < lastYear).length
        sybuntValue += priorYearGiving
      }
    }

    // Calculate retention rate
    const retentionRate = lastYearDonors > 0
      ? Math.round((retainedDonors / lastYearDonors) * 100)
      : 0

    // Calculate reactivation rate
    const lapsedDonors = sybuntCount + lybuntCount
    const reactivationRate = lapsedDonors > 0
      ? Math.round((reactivatedDonors / (lapsedDonors + reactivatedDonors)) * 100)
      : 0

    // New donors this year (first-time givers)
    const newDonorsThisYear = currentYearDonors - retainedDonors - reactivatedDonors

    return {
      lybuntCount,
      lybuntValue,
      sybuntCount,
      sybuntValue,
      retentionRate,
      reactivationRate,
      averageDonorLifespan: 2.5, // Would need more complex calculation
      currentYearDonors,
      lastYearDonors,
      newDonorsThisYear: Math.max(0, newDonorsThisYear),
      retainedDonors,
    }
  } catch (error) {
    console.error('Error in getRetentionStats:', error)
    return getEmptyStats()
  }
}

/**
 * Get LYBUNT contacts (gave last year but not this year)
 */
export async function getLybuntContacts(): Promise<LybuntContact[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    const lastYearStart = `${currentYear - 1}-01-01`
    const lastYearEnd = `${currentYear - 1}-12-31`
    const thisYearStart = `${currentYear}-01-01`

    // Get contacts who gave last year
    const { data: lastYearGivers } = await supabase
      .from('gifts')
      .select('contact_id')
      .eq('organization_id', organizationId)
      .gte('gift_date', lastYearStart)
      .lte('gift_date', lastYearEnd)

    if (!lastYearGivers) return []

    const lastYearContactIds = [...new Set(lastYearGivers.map(g => g.contact_id))]

    // Get contacts who gave this year
    const { data: thisYearGivers } = await supabase
      .from('gifts')
      .select('contact_id')
      .eq('organization_id', organizationId)
      .gte('gift_date', thisYearStart)

    const thisYearContactIds = new Set((thisYearGivers || []).map(g => g.contact_id))

    // LYBUNT = last year givers minus this year givers
    const lybuntContactIds = lastYearContactIds.filter(id => !thisYearContactIds.has(id))

    if (lybuntContactIds.length === 0) return []

    // Get contact details
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, last_gift_date, lifetime_giving, total_gifts')
      .eq('organization_id', organizationId)
      .in('id', lybuntContactIds)
      .is('archived_at', null)
      .order('lifetime_giving', { ascending: false })
      .limit(100)

    if (!contacts) return []

    const now = new Date()

    // Get last gift amounts
    const { data: lastGifts } = await supabase
      .from('gifts')
      .select('contact_id, amount, gift_date')
      .eq('organization_id', organizationId)
      .in('contact_id', lybuntContactIds)
      .order('gift_date', { ascending: false })

    const lastGiftByContact = new Map<string, { amount: number; date: string }>()
    for (const gift of lastGifts || []) {
      if (!lastGiftByContact.has(gift.contact_id)) {
        lastGiftByContact.set(gift.contact_id, {
          amount: Number(gift.amount),
          date: gift.gift_date,
        })
      }
    }

    return contacts.map(contact => {
      const lastGift = lastGiftByContact.get(contact.id)
      const lastGiftDate = contact.last_gift_date || lastGift?.date || ''
      const daysSince = lastGiftDate
        ? Math.floor((now.getTime() - new Date(lastGiftDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        lastGiftDate,
        lastGiftAmount: lastGift?.amount || 0,
        lifetimeGiving: Number(contact.lifetime_giving) || 0,
        totalGifts: contact.total_gifts || 0,
        daysSinceLastGift: daysSince,
      }
    })
  } catch (error) {
    console.error('Error in getLybuntContacts:', error)
    return []
  }
}

function getEmptyStats(): RetentionStats {
  return {
    lybuntCount: 0,
    lybuntValue: 0,
    sybuntCount: 0,
    sybuntValue: 0,
    retentionRate: 0,
    reactivationRate: 0,
    averageDonorLifespan: 0,
    currentYearDonors: 0,
    lastYearDonors: 0,
    newDonorsThisYear: 0,
    retainedDonors: 0,
  }
}
