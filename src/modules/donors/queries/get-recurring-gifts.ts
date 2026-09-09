'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface RecurringGift {
  id: string
  contactId: string
  contactName: string
  contactEmail: string | null
  amount: number
  frequency: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  status: 'active' | 'paused' | 'cancelled' | 'failed'
  lastChargeDate: string | null
  nextChargeDate: string | null
  totalContributed: number
  stripeSubscriptionId: string | null
}

export interface RecurringGiftStats {
  activeRecurring: number
  monthlyRevenue: number
  yearlyRevenue: number
  averageGift: number
  totalDonors: number
  pausedCount: number
  failedCount: number
}

/**
 * Get recurring gift statistics
 */
export async function getRecurringGiftStats(): Promise<RecurringGiftStats> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        activeRecurring: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        averageGift: 0,
        totalDonors: 0,
        pausedCount: 0,
        failedCount: 0,
      }
    }

    const supabase = await createClient()

    // Get recurring gifts from manual entry
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('amount, gift_type, contact_id')
      .eq('organization_id', organizationId)
      .eq('gift_type', 'recurring')

    if (error) {
      console.error('Error fetching recurring stats:', error)
      return {
        activeRecurring: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        averageGift: 0,
        totalDonors: 0,
        pausedCount: 0,
        failedCount: 0,
      }
    }

    const activeGifts = gifts || []
    const totalActive = activeGifts.length
    const totalAmount = activeGifts.reduce((sum, g) => sum + Number(g.amount), 0)

    return {
      activeRecurring: totalActive,
      monthlyRevenue: totalAmount,
      yearlyRevenue: totalAmount * 12,
      averageGift: totalActive > 0 ? totalAmount / totalActive : 0,
      totalDonors: new Set(activeGifts.map(g => g.contact_id).filter(Boolean)).size,
      pausedCount: 0,
      failedCount: 0,
    }
  } catch (error) {
    console.error('Error in getRecurringGiftStats:', error)
    return {
      activeRecurring: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      averageGift: 0,
      totalDonors: 0,
      pausedCount: 0,
      failedCount: 0,
    }
  }
}

/**
 * Get list of recurring gifts
 */
export async function getRecurringGifts(): Promise<RecurringGift[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()

    // Get recurring gifts from manual entry
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select(`
        id,
        contact_id,
        amount,
        gift_date,
        gift_type,
        contacts (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('gift_type', 'recurring')
      .order('gift_date', { ascending: false })
      .limit(100)

    if (error || !gifts) {
      console.error('Error fetching recurring gifts:', error)
      return []
    }

    return gifts.map((gift: any) => ({
      id: gift.id,
      contactId: gift.contact_id,
      contactName: `${gift.contacts?.first_name || ''} ${gift.contacts?.last_name || ''}`.trim(),
      contactEmail: gift.contacts?.email || null,
      amount: Number(gift.amount),
      frequency: 'monthly' as const,
      startDate: gift.gift_date,
      status: 'active' as const,
      lastChargeDate: gift.gift_date,
      nextChargeDate: null, // Would need subscription tracking
      totalContributed: Number(gift.amount), // Would need to aggregate
      stripeSubscriptionId: null,
    }))
  } catch (error) {
    console.error('Error in getRecurringGifts:', error)
    return []
  }
}
