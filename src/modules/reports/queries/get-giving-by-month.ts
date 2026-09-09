'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface GivingByMonth {
  month: string // "2024-01"
  total: number
  count: number
}

/**
 * Get monthly giving totals for reports
 * Supports optional date range and campaign filtering
 */
export async function getGivingByMonth(options?: {
  startDate?: string
  endDate?: string
  campaign?: string
}): Promise<GivingByMonth[]> {
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

    // Build query
    let query = supabase
      .from('gifts')
      .select('gift_date, amount, campaign')
      .eq('organization_id', organizationId)

    // Apply filters
    if (options?.startDate) {
      query = query.gte('gift_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('gift_date', options.endDate)
    }
    if (options?.campaign) {
      query = query.eq('campaign', options.campaign)
    }

    query = query.order('gift_date', { ascending: true })

    const { data: gifts, error: giftsError } = await query

    if (giftsError) {
      throw new Error('Failed to fetch gifts')
    }

    // Group by month
    const monthlyMap = new Map<string, { total: number; count: number }>()

    gifts?.forEach((gift) => {
      const date = new Date(gift.gift_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const existing = monthlyMap.get(monthKey) || { total: 0, count: 0 }
      monthlyMap.set(monthKey, {
        total: existing.total + gift.amount,
        count: existing.count + 1,
      })
    })

    // Convert to array and sort
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  } catch (error) {
    console.error('Error fetching giving by month:', error)
    throw error
  }
}
