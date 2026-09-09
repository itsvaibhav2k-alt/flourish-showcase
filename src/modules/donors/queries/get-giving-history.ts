'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface MonthlyGiving {
  month: string // "2024-01", "2024-02", etc.
  total: number // Total amount for that month
  count: number // Number of gifts
}

export interface GivingHistoryData {
  monthly: MonthlyGiving[] // Last 12 months
  yearOverYear: {
    currentYear: number
    previousYear: number
    percentChange: number
  }
}

export type TimeRange = 'month' | '3months' | '12months' | 'all'

/**
 * Server function to fetch giving history data for charts
 * Returns monthly giving totals and year-over-year comparison
 */
export async function getGivingHistory(timeRange: TimeRange = '12months'): Promise<GivingHistoryData> {
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

    // Calculate date ranges based on timeRange parameter
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-11

    // Determine number of months to fetch
    let monthsToFetch: number
    let startDate: Date

    switch (timeRange) {
      case 'month':
        monthsToFetch = 1
        startDate = new Date(currentYear, currentMonth, 1)
        break
      case '3months':
        monthsToFetch = 3
        startDate = new Date(currentYear, currentMonth - 2, 1)
        break
      case '12months':
        monthsToFetch = 12
        startDate = new Date(currentYear, currentMonth - 11, 1)
        break
      case 'all':
        // For 'all', we'll fetch all gifts and then determine the range
        monthsToFetch = 120 // 10 years max for display
        startDate = new Date(currentYear - 10, 0, 1)
        break
      default:
        monthsToFetch = 12
        startDate = new Date(currentYear, currentMonth - 11, 1)
    }

    const startDateString = startDate.toISOString().split('T')[0]

    // Get all gifts from the specified time range
    let giftsQuery = supabase
      .from('gifts')
      .select('gift_date, amount')
      .eq('organization_id', organizationId)
      .order('gift_date', { ascending: true })

    // Only filter by date if not 'all'
    if (timeRange !== 'all') {
      giftsQuery = giftsQuery.gte('gift_date', startDateString)
    }

    const { data: gifts, error: giftsError } = await giftsQuery

    if (giftsError) {
      throw new Error('Failed to fetch gifts')
    }

    // If timeRange is 'all' and we have gifts, adjust the start date to the first gift
    if (timeRange === 'all' && gifts && gifts.length > 0) {
      const firstGiftDate = new Date(gifts[0].gift_date)
      startDate = new Date(firstGiftDate.getFullYear(), firstGiftDate.getMonth(), 1)

      // Calculate months between first gift and now
      const monthsDiff = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()) + 1
      monthsToFetch = Math.min(monthsDiff, 120) // Cap at 10 years
    }

    // Group gifts by month
    const monthlyMap = new Map<string, { total: number; count: number }>()

    // Initialize all months with zero values
    for (let i = 0; i < monthsToFetch; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(monthKey, { total: 0, count: 0 })
    }

    // Aggregate gifts by month
    gifts?.forEach((gift) => {
      const date = new Date(gift.gift_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (monthlyMap.has(monthKey)) {
        const existing = monthlyMap.get(monthKey)!
        monthlyMap.set(monthKey, {
          total: existing.total + gift.amount,
          count: existing.count + 1,
        })
      }
    })

    // Convert map to array and sort
    const monthly: MonthlyGiving[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Calculate year-over-year comparison
    const currentYearStart = `${currentYear}-01-01`
    const previousYearStart = `${currentYear - 1}-01-01`
    const previousYearEnd = `${currentYear - 1}-12-31`

    const { data: currentYearGifts, error: currentYearError } = await supabase
      .from('gifts')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('gift_date', currentYearStart)

    const { data: previousYearGifts, error: previousYearError } = await supabase
      .from('gifts')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('gift_date', previousYearStart)
      .lte('gift_date', previousYearEnd)

    if (currentYearError || previousYearError) {
      throw new Error('Failed to fetch year-over-year data')
    }

    const currentYearTotal = currentYearGifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0
    const previousYearTotal = previousYearGifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0

    const percentChange = previousYearTotal > 0
      ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100
      : 0

    return {
      monthly,
      yearOverYear: {
        currentYear: currentYearTotal,
        previousYear: previousYearTotal,
        percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal
      },
    }
  } catch (error) {
    console.error('Error fetching giving history:', error)
    throw error
  }
}
