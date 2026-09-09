'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSmartAsk, type SmartAskResult } from '@/lib/ai/smart-ask/calculate-amounts'
import type { CalculateSmartAskInput } from '../schemas/smart-ask.schema'
import { getSmartAskConfig, getDefaultSmartAskConfig } from '../queries/get-smart-ask-config'

export type CalculateSmartAskActionResult =
  | { success: true; data: SmartAskResult }
  | { success: false; error: string }

/**
 * Server action to calculate Smart Ask amounts for a donor
 * - Fetches donor's gift history
 * - Fetches donor's giving potential (capacity/affinity/propensity)
 * - Fetches donor's lapse risk
 * - Applies organization's Smart Ask configuration
 * - Returns calculated amounts with confidence scores
 */
export async function calculateSmartAskAction(
  input: CalculateSmartAskInput
): Promise<CalculateSmartAskActionResult> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, lapse_risk')
      .eq('id', input.contact_id)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Fetch donor's gift history
    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('amount, gift_date')
      .eq('contact_id', input.contact_id)
      .eq('organization_id', organizationId)
      .order('gift_date', { ascending: false })

    if (giftsError) {
      return { success: false, error: 'Failed to fetch gift history' }
    }

    const giftCount = gifts?.length || 0
    const lastGiftAmount = gifts?.[0]?.amount || null
    const averageGiftAmount =
      giftCount > 0
        ? gifts.reduce((sum, g) => sum + g.amount, 0) / giftCount
        : null
    const largestGiftAmount = giftCount > 0 ? Math.max(...gifts.map((g) => g.amount)) : null

    // Fetch donor's giving potential
    const { data: givingPotential } = await supabase
      .from('giving_potential')
      .select('capacity_score, affinity_score, propensity_score')
      .eq('contact_id', input.contact_id)
      .maybeSingle()

    // Get organization's Smart Ask config
    const config = await getSmartAskConfig()
    const smartAskConfig = config || getDefaultSmartAskConfig()

    // Calculate Smart Ask amounts
    const result = calculateSmartAsk(
      {
        gifts: gifts || [],
        giftCount,
        lastGiftAmount,
        averageGiftAmount,
        largestGiftAmount,
      },
      {
        capacity_score: givingPotential?.capacity_score,
        affinity_score: givingPotential?.affinity_score,
        propensity_score: givingPotential?.propensity_score,
      },
      (contact.lapse_risk as 'low' | 'medium' | 'high' | 'unknown') || 'unknown',
      {
        stretchMultiplier: smartAskConfig.stretch_multiplier,
        targetMultiplier: smartAskConfig.target_multiplier,
        accessibleMultiplier: smartAskConfig.accessible_multiplier,
        capacityWeight: smartAskConfig.capacity_weight,
        highRiskReduction: smartAskConfig.high_risk_reduction,
        mediumRiskReduction: smartAskConfig.medium_risk_reduction,
      }
    )

    return { success: true, data: result }
  } catch (error) {
    console.error('Error calculating smart ask:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
