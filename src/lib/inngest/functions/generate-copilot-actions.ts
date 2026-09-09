/**
 * Generate AI Fundraising Copilot Actions
 *
 * Runs daily at 6 AM to generate fresh action suggestions for all organizations.
 * Analyzes donors and creates prioritized action recommendations.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { generateCopilotAction } from '@/lib/ai/copilot/action-generator'

export const generateCopilotActions = inngest.createFunction(
  {
    id: 'generate-copilot-actions',
    name: 'Generate AI Copilot Actions',
  },
  // Run daily at 6 AM
  { cron: '0 6 * * *' },
  async ({ step }) => {
    // Step 1: Get all active organizations
    const organizations = await step.run('fetch-organizations', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch organizations: ${error.message}`)
      }

      return data || []
    })

    console.log(`Processing copilot actions for ${organizations.length} organizations`)

    // Step 2: Process each organization
    const results = []

    for (const org of organizations) {
      const orgResult = await step.run(
        `process-org-${org.id}`,
        async () => {
          const supabase = createAdminClient()

          // Clear old uncompleted actions (older than 7 days)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          await supabase
            .from('copilot_actions')
            .delete()
            .eq('organization_id', org.id)
            .eq('status', 'pending')
            .lt('generated_at', sevenDaysAgo.toISOString())

          // Select top priority donors for action generation
          const priorityDonors = await selectTopPriorityDonors(supabase, org.id)

          console.log(
            `Organization ${org.name}: Selected ${priorityDonors.length} priority donors`
          )

          // Generate actions for priority donors
          const actionsCreated = []

          for (const donor of priorityDonors) {
            try {
              // Generate AI-powered action
              const action = await generateCopilotAction(donor.contact_id)

              // Save to database
              const { data, error } = await supabase
                .from('copilot_actions')
                .insert({
                  organization_id: org.id,
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
                console.error(
                  `Failed to save action for donor ${donor.contact_id}:`,
                  error
                )
              } else {
                actionsCreated.push(data.id)
              }
            } catch (error) {
              console.error(
                `Error generating action for donor ${donor.contact_id}:`,
                error
              )
            }

            // Small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          return {
            organizationId: org.id,
            organizationName: org.name,
            donorsAnalyzed: priorityDonors.length,
            actionsCreated: actionsCreated.length,
          }
        }
      )

      results.push(orgResult)
    }

    return {
      organizationsProcessed: organizations.length,
      results,
      totalActions: results.reduce((sum, r) => sum + r.actionsCreated, 0),
    }
  }
)

/**
 * Select top priority donors for action generation
 *
 * Criteria:
 * 1. High lapse risk donors (haven't given in longer than their average cycle)
 * 2. Major donors ($1000+ lifetime) who are active
 * 3. Recent givers needing stewardship (gave in last 30 days)
 * 4. Donors with positive giving trends
 * 5. Regular donors in their giving window
 */
async function selectTopPriorityDonors(
  supabase: any,
  organizationId: string,
  limit: number = 20
): Promise<Array<{ contact_id: string; priority_reason: string }>> {
  const priorityDonors: Array<{ contact_id: string; priority_reason: string }> = []

  // 1. HIGH LAPSE RISK DONORS
  // Donors who haven't given recently and are at risk
  const { data: lapseRiskDonors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lifetime_giving, last_gift_date, total_gifts')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .eq('lapse_risk', 'high')
    .gte('lifetime_giving', 100) // At least $100 lifetime
    .is('archived_at', null)
    .order('lifetime_giving', { ascending: false })
    .limit(5)

  if (lapseRiskDonors) {
    lapseRiskDonors.forEach(d => {
      priorityDonors.push({
        contact_id: d.id,
        priority_reason: 'high_lapse_risk',
      })
    })
  }

  // 2. MAJOR DONORS (Active)
  // High-value donors who have given in the last 2 years
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { data: majorDonors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lifetime_giving, last_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .gte('lifetime_giving', 1000) // $1000+ lifetime
    .gte('last_gift_date', twoYearsAgo.toISOString())
    .is('archived_at', null)
    .order('lifetime_giving', { ascending: false })
    .limit(5)

  if (majorDonors) {
    majorDonors.forEach(d => {
      // Avoid duplicates
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'major_donor',
        })
      }
    })
  }

  // 3. RECENT GIVERS (Last 30 days)
  // Need stewardship and follow-up
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
    recentGivers.forEach(d => {
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'recent_gift',
        })
      }
    })
  }

  // 4. MULTI-GIFT DONORS (Building habit)
  // Donors with 2-5 gifts (emerging regulars)
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
    emergingDonors.forEach(d => {
      if (!priorityDonors.find(p => p.contact_id === d.id)) {
        priorityDonors.push({
          contact_id: d.id,
          priority_reason: 'emerging_regular',
        })
      }
    })
  }

  // 5. FILL REMAINING SLOTS with active mid-level donors
  if (priorityDonors.length < limit) {
    const remaining = limit - priorityDonors.length

    const { data: midLevelDonors } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, lifetime_giving, last_gift_date')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .gte('lifetime_giving', 250)
      .lt('lifetime_giving', 1000)
      .gte('last_gift_date', twoYearsAgo.toISOString())
      .is('archived_at', null)
      .order('lifetime_giving', { ascending: false })
      .limit(remaining)

    if (midLevelDonors) {
      midLevelDonors.forEach(d => {
        if (!priorityDonors.find(p => p.contact_id === d.id)) {
          priorityDonors.push({
            contact_id: d.id,
            priority_reason: 'mid_level_active',
          })
        }
      })
    }
  }

  console.log(`Selected ${priorityDonors.length} priority donors for ${organizationId}`)
  return priorityDonors.slice(0, limit)
}
