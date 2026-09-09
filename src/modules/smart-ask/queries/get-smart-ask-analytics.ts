'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface SmartAskAnalytics {
  totalSuggestions: number
  totalConversions: number
  conversionRate: number
  averageGiftAmount: number
  suggestionTypeBreakdown: {
    stretch: { count: number; converted: number; rate: number }
    target: { count: number; converted: number; rate: number }
    accessible: { count: number; converted: number; rate: number }
    custom: { count: number; converted: number; rate: number }
  }
  recentSuggestions: Array<{
    id: string
    contact_id: string
    contact_name: string
    suggestion_type: string
    shown_amount: number
    actual_gift_amount: number | null
    converted: boolean
    suggested_at: string
  }>
}

/**
 * Get Smart Ask analytics and conversion tracking
 */
export async function getSmartAskAnalytics(): Promise<SmartAskAnalytics> {
  try {
    const supabase = await createClient()

    // Get organization ID
    let organizationId: string | null = null

    if (process.env.BYPASS_AUTH === 'true') {
      organizationId = await getCurrentOrganizationId()
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
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

    // Get all smart ask results
    const { data: results, error: resultsError } = await supabase
      .from('smart_ask_results')
      .select('*')
      .eq('organization_id', organizationId)
      .order('suggested_at', { ascending: false })

    if (resultsError) {
      throw new Error('Failed to fetch smart ask results')
    }

    // Calculate aggregate statistics
    const totalSuggestions = results?.length || 0
    const totalConversions = results?.filter((r) => r.converted).length || 0
    const conversionRate = totalSuggestions > 0 ? totalConversions / totalSuggestions : 0

    const convertedResults = results?.filter((r) => r.converted && r.actual_gift_amount) || []
    const averageGiftAmount =
      convertedResults.length > 0
        ? convertedResults.reduce((sum, r) => sum + (r.actual_gift_amount || 0), 0) /
          convertedResults.length
        : 0

    // Breakdown by suggestion type
    const suggestionTypes = ['stretch', 'target', 'accessible', 'custom'] as const
    const suggestionTypeBreakdown = suggestionTypes.reduce(
      (acc, type) => {
        const typeResults = results?.filter((r) => r.suggestion_type === type) || []
        const typeConverted = typeResults.filter((r) => r.converted).length
        acc[type] = {
          count: typeResults.length,
          converted: typeConverted,
          rate: typeResults.length > 0 ? typeConverted / typeResults.length : 0,
        }
        return acc
      },
      {} as SmartAskAnalytics['suggestionTypeBreakdown']
    )

    // Get recent suggestions with contact names
    const recentResults = results?.slice(0, 10) || []
    const contactIds = [...new Set(recentResults.map((r) => r.contact_id))]

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .in('id', contactIds)

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
    }

    const contactMap = new Map(
      contacts?.map((c) => [c.id, `${c.first_name} ${c.last_name}`]) || []
    )

    const recentSuggestions = recentResults.map((r) => ({
      id: r.id,
      contact_id: r.contact_id,
      contact_name: contactMap.get(r.contact_id) || 'Unknown',
      suggestion_type: r.suggestion_type || 'unknown',
      shown_amount: r.shown_amount || 0,
      actual_gift_amount: r.actual_gift_amount,
      converted: r.converted,
      suggested_at: r.suggested_at,
    }))

    return {
      totalSuggestions,
      totalConversions,
      conversionRate,
      averageGiftAmount,
      suggestionTypeBreakdown,
      recentSuggestions,
    }
  } catch (error) {
    console.error('Error fetching smart ask analytics:', error)
    // Return empty analytics on error
    return {
      totalSuggestions: 0,
      totalConversions: 0,
      conversionRate: 0,
      averageGiftAmount: 0,
      suggestionTypeBreakdown: {
        stretch: { count: 0, converted: 0, rate: 0 },
        target: { count: 0, converted: 0, rate: 0 },
        accessible: { count: 0, converted: 0, rate: 0 },
        custom: { count: 0, converted: 0, rate: 0 },
      },
      recentSuggestions: [],
    }
  }
}
