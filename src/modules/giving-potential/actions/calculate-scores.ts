'use server'

import { createClient } from '@/lib/supabase/server'
import {
  wealthDataSchema,
  contactEngagementSchema,
  type WealthData,
  type ContactEngagement,
  type CalculatedScores,
} from '../schemas/giving-potential.schema'
import {
  calculateCapacityScore,
  calculateAffinityScore,
  calculatePropensityScore,
  calculateOverallScore,
  calculateGivingGapRatio,
} from '../services/score-calculator'

export type CalculateScoresInput = {
  wealthData?: Partial<WealthData>
  contactEngagement?: Partial<ContactEngagement>
  estimatedCapacity?: number
}

export type CalculateScoresResult =
  | { success: true; scores: CalculatedScores }
  | { success: false; error: string }

/**
 * Server action that takes raw data and calculates all scores
 *
 * Calculates:
 * - capacity_score: based on net worth, real estate, stocks, job level, political donations
 * - affinity_score: based on lifetime giving, gift count, volunteer hours, email engagement
 * - propensity_score: based on recency, frequency, giving trends
 * - overall_score: weighted average of all three (Capacity 40%, Affinity 30%, Propensity 30%)
 *
 * Returns the calculated scores for use in saveGivingPotential action
 */
export async function calculateScores(
  input: CalculateScoresInput
): Promise<CalculateScoresResult> {
  try {
    const { wealthData = {}, contactEngagement = {}, estimatedCapacity } = input

    // Validate inputs (partial validation - only validate provided fields)
    const validatedWealth = wealthDataSchema.partial().parse(wealthData)
    const validatedEngagement = contactEngagementSchema.partial().parse(contactEngagement)

    // Calculate individual scores
    const capacityScore = calculateCapacityScore(validatedWealth)
    const affinityScore = calculateAffinityScore(validatedEngagement, estimatedCapacity)
    const propensityScore = calculatePropensityScore(validatedEngagement)

    // Calculate overall score
    const overallScore = calculateOverallScore(capacityScore, affinityScore, propensityScore)

    // Calculate giving gap ratio if we have the data
    let givingGapRatio: number | null = null
    if (
      estimatedCapacity &&
      estimatedCapacity > 0 &&
      validatedEngagement.lifetime_giving !== undefined
    ) {
      givingGapRatio = calculateGivingGapRatio(validatedEngagement.lifetime_giving, estimatedCapacity)
    }

    const scores: CalculatedScores = {
      capacity_score: capacityScore,
      affinity_score: affinityScore,
      propensity_score: propensityScore,
      overall_score: overallScore,
      giving_gap_ratio: givingGapRatio,
    }

    return { success: true, scores }
  } catch (error) {
    console.error('Error calculating scores:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to calculate scores' }
  }
}

/**
 * Server action to calculate scores for an existing contact
 * Fetches contact data from database and calculates scores
 */
export async function calculateScoresForContact(
  contactId: string,
  wealthData?: Partial<WealthData>
): Promise<CalculateScoresResult> {
  try {
    const supabase = await createClient()

    // Fetch contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('lifetime_giving, total_gifts, total_volunteer_hours, last_gift_date')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Fetch gift history for propensity calculation
    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('amount, gift_date')
      .eq('contact_id', contactId)
      .order('gift_date', { ascending: true })

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError)
      // Continue without gift history
    }

    // Calculate engagement metrics
    const giftCount = contact.total_gifts || 0
    const lifetimeGiving = contact.lifetime_giving || 0
    const avgGiftAmount = giftCount > 0 ? lifetimeGiving / giftCount : 0
    const firstGiftDate = gifts && gifts.length > 0 ? gifts[0].gift_date : null
    const lastGiftDate = contact.last_gift_date

    const contactEngagement: Partial<ContactEngagement> = {
      lifetime_giving: lifetimeGiving,
      gift_count: giftCount,
      total_volunteer_hours: contact.total_volunteer_hours || 0,
      avg_gift_amount: avgGiftAmount,
      first_gift_date: firstGiftDate,
      last_gift_date: lastGiftDate,
    }

    // Calculate estimated capacity from wealth data
    let estimatedCapacity: number | undefined
    if (wealthData) {
      // Simple estimation: real estate + stocks + (net worth if provided)
      const realEstate = wealthData.real_estate_value || 0
      const stocks = wealthData.stock_holdings || 0
      const netWorth = wealthData.estimated_net_worth || 0

      // Use net worth if provided, otherwise sum assets
      estimatedCapacity = netWorth > 0 ? netWorth : realEstate + stocks

      // Assume 5-10% giving capacity on wealth
      if (estimatedCapacity > 0) {
        estimatedCapacity = estimatedCapacity * 0.075 // 7.5% average
      }
    }

    // Calculate scores
    return calculateScores({
      wealthData,
      contactEngagement,
      estimatedCapacity,
    })
  } catch (error) {
    console.error('Error in calculateScoresForContact:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to calculate scores for contact' }
  }
}

/**
 * Helper function to recalculate scores for all contacts with giving potential
 * Useful for batch updates when scoring algorithm changes
 */
export async function recalculateAllScores(): Promise<{
  success: boolean
  updated: number
  errors: number
}> {
  try {
    const supabase = await createClient()

    // Get all giving potential records
    const { data: records, error: fetchError } = await supabase
      .from('giving_potential')
      .select('contact_id, real_estate_value, stock_holdings, political_donations, estimated_net_worth')

    if (fetchError) {
      console.error('Error fetching giving potential records:', fetchError)
      return { success: false, updated: 0, errors: 0 }
    }

    if (!records || records.length === 0) {
      return { success: true, updated: 0, errors: 0 }
    }

    let updated = 0
    let errors = 0

    // Recalculate scores for each record
    for (const record of records) {
      try {
        const wealthData: Partial<WealthData> = {
          real_estate_value: record.real_estate_value || undefined,
          stock_holdings: record.stock_holdings || undefined,
          political_donations: record.political_donations || undefined,
          estimated_net_worth: record.estimated_net_worth || undefined,
        }

        const result = await calculateScoresForContact(record.contact_id, wealthData)

        if (result.success) {
          // Update the record with new scores
          const { error: updateError } = await supabase
            .from('giving_potential')
            .update({
              capacity_score: result.scores.capacity_score,
              affinity_score: result.scores.affinity_score,
              propensity_score: result.scores.propensity_score,
              overall_score: result.scores.overall_score,
              giving_gap_ratio: result.scores.giving_gap_ratio,
            })
            .eq('contact_id', record.contact_id)

          if (updateError) {
            console.error(`Error updating scores for contact ${record.contact_id}:`, updateError)
            errors++
          } else {
            updated++
          }
        } else {
          errors++
        }
      } catch (err) {
        console.error(`Error processing contact ${record.contact_id}:`, err)
        errors++
      }
    }

    return { success: true, updated, errors }
  } catch (error) {
    console.error('Error in recalculateAllScores:', error)
    return { success: false, updated: 0, errors: 0 }
  }
}
