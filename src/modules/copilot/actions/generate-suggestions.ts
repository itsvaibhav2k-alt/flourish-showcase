'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generateCopilotAction } from '@/lib/ai/copilot/action-generator'
import { revalidatePath } from 'next/cache'

export interface GenerateSuggestionsResult {
  success: boolean
  actionsCreated: number
  error?: string
}

/**
 * Generate Flora suggestions on-demand for the current organization
 * This allows users to trigger suggestion generation without waiting for the scheduled job
 */
export async function generateSuggestions(): Promise<GenerateSuggestionsResult> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, actionsCreated: 0, error: 'No organization selected' }
    }

    // Check if there are already pending suggestions (avoid duplicates)
    const { count: existingCount } = await supabase
      .from('copilot_actions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')

    if (existingCount && existingCount > 0) {
      return {
        success: true,
        actionsCreated: 0,
        error: 'You already have pending suggestions. Complete or dismiss them first.',
      }
    }

    // Clear old uncompleted actions (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    await supabase
      .from('copilot_actions')
      .delete()
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lt('generated_at', sevenDaysAgo.toISOString())

    // Select top priority donors for action generation
    const priorityDonors = await selectTopPriorityDonors(supabase, organizationId)

    if (priorityDonors.length === 0) {
      return {
        success: true,
        actionsCreated: 0,
        error: 'No donors found to analyze. Add some donors first!',
      }
    }

    console.log(`Generating suggestions for ${priorityDonors.length} priority donors`)

    // Generate actions for priority donors (limit to 10 for on-demand to be faster)
    const actionsCreated: string[] = []

    for (const donor of priorityDonors.slice(0, 10)) {
      try {
        // Generate AI-powered action
        const action = await generateCopilotAction(donor.contact_id)

        // Save to database
        const { data, error } = await supabase
          .from('copilot_actions')
          .insert({
            organization_id: organizationId,
            contact_id: donor.contact_id,
            action_type: action.actionType,
            priority: action.priority,
            title: action.title,
            description: action.description,
            reasoning: action.reasoning,
            predicted_gift_amount: action.predictedGiftAmount,
            predicted_success_rate: action.predictedSuccessRate,
            optimal_timing: action.optimalTiming,
            preferred_channel: action.preferredChannel,
            donor_score: action.donorScore,
            donor_score_reasoning: action.donorScoreReasoning,
            context_snapshot: action.contextSnapshot,
            status: 'pending',
            generated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error(`Failed to save action for donor ${donor.contact_id}:`, error)
        } else {
          actionsCreated.push(data.id)
        }
      } catch (error) {
        console.error(`Error generating action for donor ${donor.contact_id}:`, error)
      }
    }

    revalidatePath('/flora')

    return {
      success: true,
      actionsCreated: actionsCreated.length,
    }
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return {
      success: false,
      actionsCreated: 0,
      error: error instanceof Error ? error.message : 'Failed to generate suggestions',
    }
  }
}

/**
 * Select top priority donors for action generation
 */
async function selectTopPriorityDonors(
  supabase: any,
  organizationId: string,
  limit: number = 20
): Promise<Array<{ contact_id: string; priority_reason: string }>> {
  const priorityDonors: Array<{ contact_id: string; priority_reason: string }> = []

  // 1. HIGH LAPSE RISK DONORS
  const { data: lapseRiskDonors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lifetime_giving, last_gift_date, total_gifts')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .eq('lapse_risk', 'high')
    .gte('lifetime_giving', 100)
    .is('archived_at', null)
    .order('lifetime_giving', { ascending: false })
    .limit(5)

  if (lapseRiskDonors) {
    lapseRiskDonors.forEach((d: any) => {
      priorityDonors.push({
        contact_id: d.id,
        priority_reason: 'high_lapse_risk',
      })
    })
  }

  // 2. MAJOR DONORS (Active)
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { data: majorDonors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lifetime_giving, last_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .gte('lifetime_giving', 1000)
    .gte('last_gift_date', twoYearsAgo.toISOString())
    .is('archived_at', null)
    .order('lifetime_giving', { ascending: false })
    .limit(5)

  if (majorDonors) {
    majorDonors.forEach((d: any) => {
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'major_donor',
        })
      }
    })
  }

  // 3. RECENT GIVERS (Last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentGivers } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lifetime_giving, last_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .gte('last_gift_date', thirtyDaysAgo.toISOString())
    .is('archived_at', null)
    .order('last_gift_date', { ascending: false })
    .limit(5)

  if (recentGivers) {
    recentGivers.forEach((d: any) => {
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'recent_gift',
        })
      }
    })
  }

  // 4. MULTI-GIFT DONORS (Building habit)
  const { data: emergingDonors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, total_gifts, lifetime_giving, last_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .gte('total_gifts', 2)
    .lte('total_gifts', 5)
    .gte('last_gift_date', twoYearsAgo.toISOString())
    .is('archived_at', null)
    .order('total_gifts', { ascending: false })
    .limit(5)

  if (emergingDonors) {
    emergingDonors.forEach((d: any) => {
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'emerging_regular',
        })
      }
    })
  }

  // 5. FILL REMAINING with any active donors
  if (priorityDonors.length < limit) {
    const remaining = limit - priorityDonors.length
    const existingIds = priorityDonors.map(p => p.contact_id)

    const { data: anyDonors } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, lifetime_giving, last_gift_date')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .not('id', 'in', `(${existingIds.join(',')})`)
      .order('lifetime_giving', { ascending: false })
      .limit(remaining)

    if (anyDonors) {
      anyDonors.forEach((d: any) => {
        if (!priorityDonors.find(p => p.contact_id === d.id)) {
          priorityDonors.push({
            contact_id: d.id,
            priority_reason: 'active_donor',
          })
        }
      })
    }
  }

  console.log(`Selected ${priorityDonors.length} priority donors for ${organizationId}`)
  return priorityDonors.slice(0, limit)
}
