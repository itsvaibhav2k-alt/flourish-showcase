'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

// =============================================================================
// Types
// =============================================================================

export interface FloraRecommendation {
  id: string
  firstName: string
  lastName: string
  email: string | null
  recommendationType: 'at-risk' | 'major-donor' | 'lapsed' | 're-engagement'
  recommendedAction: string
  priority: 'high' | 'medium' | 'low'
  successProbability: number // 0-100
  lifetimeGiving: number
  lastGiftDate: string | null
  daysSinceLastGift: number | null
  lapseRisk: 'low' | 'medium' | 'high' | null
}

export interface DonorHealthScore {
  score: number // 0-100
  trend: 'up' | 'down' | 'stable'
  totalDonors: number
  atRiskCount: number
  retentionRate: number
  topInsight: string
}

export interface WeeklyPriority {
  id: string
  contactId: string
  contactName: string
  action: string
  priority: 'high' | 'medium' | 'low'
  segment: 'major' | 'active' | 'new' | 'lapsed'
  dueDate: string | null
}

export interface OrgPulse {
  totalRaised: number
  donorCount: number
  volunteerHours: number
  alerts: number
}

// =============================================================================
// Helper Functions
// =============================================================================

function calculateSuccessProbability(
  giftCount: number,
  lifetimeGiving: number,
  daysSinceLastGift: number | null,
  lapseRisk: string | null
): number {
  let score = 50 // Base score

  // More gifts = higher probability of success
  if (giftCount >= 5) score += 20
  else if (giftCount >= 3) score += 15
  else if (giftCount >= 2) score += 10

  // Higher lifetime giving = more engaged
  if (lifetimeGiving >= 10000) score += 15
  else if (lifetimeGiving >= 1000) score += 10
  else if (lifetimeGiving >= 100) score += 5

  // Recent activity boosts score
  if (daysSinceLastGift !== null) {
    if (daysSinceLastGift <= 30) score += 15
    else if (daysSinceLastGift <= 90) score += 10
    else if (daysSinceLastGift <= 180) score += 5
    else if (daysSinceLastGift > 365) score -= 15
  }

  // Lapse risk reduces score
  if (lapseRisk === 'high') score -= 20
  else if (lapseRisk === 'medium') score -= 10

  return Math.max(0, Math.min(100, score))
}

function determinePriority(
  daysSinceLastGift: number | null,
  lifetimeGiving: number,
  lapseRisk: string | null
): 'high' | 'medium' | 'low' {
  // Major donors always high priority
  if (lifetimeGiving >= 10000) return 'high'

  // High lapse risk is high priority
  if (lapseRisk === 'high') return 'high'

  // Medium lapse risk or significant giving
  if (lapseRisk === 'medium' || lifetimeGiving >= 1000) return 'medium'

  // Recent activity but low risk
  if (daysSinceLastGift !== null && daysSinceLastGift <= 90) return 'low'

  return 'medium'
}

// =============================================================================
// Main Query Functions
// =============================================================================

/**
 * Get Flora AI recommendations for contacts that need attention
 * Includes at-risk donors, major donors due for thank-you, and lapsed donors
 */
export async function getFloraRecommendations(
  limit: number = 10
): Promise<{ success: boolean; data?: FloraRecommendation[]; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()
    const recommendations: FloraRecommendation[] = []
    const now = new Date()

    // Get donors with relevant data
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, last_gift_date, lifetime_giving, total_gifts, lapse_risk')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .order('lifetime_giving', { ascending: false })
      .limit(100)

    if (donorsError) {
      console.error('Error fetching donors for recommendations:', donorsError)
      return { success: false, error: donorsError.message }
    }

    // Process each donor and create recommendations
    for (const donor of donors || []) {
      const lastGiftDate = donor.last_gift_date ? new Date(donor.last_gift_date) : null
      const daysSinceLastGift = lastGiftDate
        ? Math.floor((now.getTime() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const lifetimeGiving = parseFloat(donor.lifetime_giving?.toString() || '0')
      const giftCount = donor.total_gifts || 0
      const lapseRisk = donor.lapse_risk as 'low' | 'medium' | 'high' | null

      const successProbability = calculateSuccessProbability(
        giftCount,
        lifetimeGiving,
        daysSinceLastGift,
        lapseRisk
      )

      const priority = determinePriority(daysSinceLastGift, lifetimeGiving, lapseRisk)

      // At-risk donors (high lapse risk but not fully lapsed)
      if (lapseRisk === 'high' && daysSinceLastGift !== null && daysSinceLastGift <= 365) {
        recommendations.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          recommendationType: 'at-risk',
          recommendedAction: 'Send personalized outreach to retain donor',
          priority,
          successProbability,
          lifetimeGiving,
          lastGiftDate: donor.last_gift_date,
          daysSinceLastGift,
          lapseRisk,
        })
      }
      // Major donors due for thank-you or check-in
      else if (lifetimeGiving >= 10000 && daysSinceLastGift !== null && daysSinceLastGift >= 60) {
        recommendations.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          recommendationType: 'major-donor',
          recommendedAction:
            daysSinceLastGift >= 180
              ? 'Schedule personal call or meeting'
              : 'Send impact update and thank-you',
          priority: 'high',
          successProbability,
          lifetimeGiving,
          lastGiftDate: donor.last_gift_date,
          daysSinceLastGift,
          lapseRisk,
        })
      }
      // Lapsed donors (no gift in 365+ days)
      else if (daysSinceLastGift !== null && daysSinceLastGift > 365) {
        recommendations.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          recommendationType: 'lapsed',
          recommendedAction: 'Send re-engagement campaign',
          priority: lifetimeGiving >= 1000 ? 'high' : 'medium',
          successProbability,
          lifetimeGiving,
          lastGiftDate: donor.last_gift_date,
          daysSinceLastGift,
          lapseRisk,
        })
      }
      // Medium lapse risk donors for early intervention
      else if (lapseRisk === 'medium' && daysSinceLastGift !== null && daysSinceLastGift >= 90) {
        recommendations.push({
          id: donor.id,
          firstName: donor.first_name,
          lastName: donor.last_name,
          email: donor.email,
          recommendationType: 're-engagement',
          recommendedAction: 'Send engagement touchpoint before risk increases',
          priority: 'medium',
          successProbability,
          lifetimeGiving,
          lastGiftDate: donor.last_gift_date,
          daysSinceLastGift,
          lapseRisk,
        })
      }
    }

    // Sort by priority (high first) then by success probability (high first)
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.successProbability - a.successProbability
    })

    return { success: true, data: recommendations.slice(0, limit) }
  } catch (error) {
    console.error('Error in getFloraRecommendations:', error)
    return { success: false, error: 'Failed to fetch recommendations' }
  }
}

/**
 * Calculate the overall donor health score for the organization
 * Based on retention rate, at-risk count, and activity metrics
 */
export async function getDonorHealthScore(): Promise<{
  success: boolean
  data?: DonorHealthScore
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()
    const now = new Date()
    const currentYear = now.getFullYear()
    const lastYear = currentYear - 1

    // Get all donors
    const { data: donors, error: donorsError } = await supabase
      .from('contacts')
      .select('id, lapse_risk, last_gift_date')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (donorsError) {
      console.error('Error fetching donors for health score:', donorsError)
      return { success: false, error: donorsError.message }
    }

    const totalDonors = donors?.length || 0

    if (totalDonors === 0) {
      return {
        success: true,
        data: {
          score: 0,
          trend: 'stable',
          totalDonors: 0,
          atRiskCount: 0,
          retentionRate: 0,
          topInsight: 'No donors found. Start building your donor base!',
        },
      }
    }

    // Count at-risk donors
    const atRiskCount = donors?.filter(
      (d) => d.lapse_risk === 'high' || d.lapse_risk === 'medium'
    ).length || 0

    // Get gifts for retention calculation
    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('contact_id, gift_date')
      .eq('organization_id', organizationId)

    if (giftsError) {
      console.error('Error fetching gifts for health score:', giftsError)
      return { success: false, error: giftsError.message }
    }

    // Build contact giving by year
    const contactYearGiving = new Map<string, Set<number>>()
    for (const gift of gifts || []) {
      const year = new Date(gift.gift_date).getFullYear()
      if (!contactYearGiving.has(gift.contact_id)) {
        contactYearGiving.set(gift.contact_id, new Set())
      }
      contactYearGiving.get(gift.contact_id)!.add(year)
    }

    // Calculate retention rate
    let lastYearDonors = 0
    let retainedDonors = 0

    for (const [, years] of contactYearGiving) {
      if (years.has(lastYear)) {
        lastYearDonors++
        if (years.has(currentYear)) {
          retainedDonors++
        }
      }
    }

    const retentionRate = lastYearDonors > 0 ? Math.round((retainedDonors / lastYearDonors) * 100) : 0

    // Calculate health score (weighted average)
    // 40% retention rate, 30% at-risk ratio (inverted), 30% activity
    const atRiskRatio = totalDonors > 0 ? atRiskCount / totalDonors : 0
    const atRiskScore = Math.max(0, 100 - atRiskRatio * 200) // Higher score if fewer at-risk

    // Activity score based on recent giving
    const recentDonors = donors?.filter((d) => {
      if (!d.last_gift_date) return false
      const daysSince = Math.floor(
        (now.getTime() - new Date(d.last_gift_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSince <= 180
    }).length || 0
    const activityRate = totalDonors > 0 ? (recentDonors / totalDonors) * 100 : 0

    const score = Math.round(retentionRate * 0.4 + atRiskScore * 0.3 + activityRate * 0.3)

    // Determine trend (would need historical data for accurate trend)
    // For now, estimate based on current metrics
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (atRiskRatio > 0.3) trend = 'down'
    else if (retentionRate > 70 && atRiskRatio < 0.15) trend = 'up'

    // Generate top insight
    let topInsight = ''
    const highRiskCount = donors?.filter((d) => d.lapse_risk === 'high').length || 0
    const majorDonorsAtRisk = donors?.filter((d) => {
      if (!d.last_gift_date) return false
      const daysSince = Math.floor(
        (now.getTime() - new Date(d.last_gift_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSince >= 90 && (d.lapse_risk === 'high' || d.lapse_risk === 'medium')
    }).length || 0

    if (majorDonorsAtRisk > 0) {
      topInsight = `${majorDonorsAtRisk} donor${majorDonorsAtRisk > 1 ? 's' : ''} at risk haven't given in 90+ days`
    } else if (highRiskCount > 0) {
      topInsight = `${highRiskCount} donor${highRiskCount > 1 ? 's' : ''} with high lapse risk need attention`
    } else if (retentionRate < 50) {
      topInsight = 'Focus on retention - current rate is below industry average'
    } else {
      topInsight = 'Donor health is strong. Consider expanding outreach.'
    }

    return {
      success: true,
      data: {
        score,
        trend,
        totalDonors,
        atRiskCount,
        retentionRate,
        topInsight,
      },
    }
  } catch (error) {
    console.error('Error in getDonorHealthScore:', error)
    return { success: false, error: 'Failed to calculate donor health score' }
  }
}

/**
 * Get weekly priorities - contacts needing action based on lapse risk and segment
 */
export async function getWeeklyPriorities(
  limit: number = 10
): Promise<{ success: boolean; data?: WeeklyPriority[]; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()
    const now = new Date()
    const priorities: WeeklyPriority[] = []

    // Get donors needing attention
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, last_gift_date, lifetime_giving, lapse_risk')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .in('lapse_risk', ['high', 'medium'])
      .order('lifetime_giving', { ascending: false })
      .limit(50)

    if (contactsError) {
      console.error('Error fetching contacts for priorities:', contactsError)
      return { success: false, error: contactsError.message }
    }

    for (const contact of contacts || []) {
      const lifetimeGiving = parseFloat(contact.lifetime_giving?.toString() || '0')
      const lastGiftDate = contact.last_gift_date ? new Date(contact.last_gift_date) : null
      const daysSinceLastGift = lastGiftDate
        ? Math.floor((now.getTime() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      // Determine segment
      let segment: 'major' | 'active' | 'new' | 'lapsed' = 'active'
      if (lifetimeGiving >= 10000) segment = 'major'
      else if (daysSinceLastGift !== null && daysSinceLastGift > 365) segment = 'lapsed'

      // Determine action
      let action = ''
      if (contact.lapse_risk === 'high') {
        action = segment === 'major' ? 'Schedule personal call' : 'Send re-engagement email'
      } else {
        action = segment === 'major' ? 'Send impact update' : 'Schedule follow-up'
      }

      // Determine priority
      const priority: 'high' | 'medium' | 'low' =
        segment === 'major' || contact.lapse_risk === 'high' ? 'high' : 'medium'

      // Calculate suggested due date (within the week)
      const dueDate = new Date()
      if (priority === 'high') {
        dueDate.setDate(dueDate.getDate() + 2) // 2 days for high priority
      } else {
        dueDate.setDate(dueDate.getDate() + 5) // 5 days for medium priority
      }

      priorities.push({
        id: `priority-${contact.id}`,
        contactId: contact.id,
        contactName: `${contact.first_name} ${contact.last_name}`,
        action,
        priority,
        segment,
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }

    // Sort by segment (major first) then priority
    priorities.sort((a, b) => {
      const segmentOrder = { major: 4, active: 3, new: 2, lapsed: 1 }
      const segmentDiff = segmentOrder[b.segment] - segmentOrder[a.segment]
      if (segmentDiff !== 0) return segmentDiff

      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return { success: true, data: priorities.slice(0, limit) }
  } catch (error) {
    console.error('Error in getWeeklyPriorities:', error)
    return { success: false, error: 'Failed to fetch weekly priorities' }
  }
}

/**
 * Get organization pulse metrics - aggregate stats from gifts, volunteers, contacts
 */
export async function getOrgPulse(): Promise<{
  success: boolean
  data?: OrgPulse
  error?: string
}> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get total raised from gifts
    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('amount')
      .eq('organization_id', organizationId)

    if (giftsError) {
      console.error('Error fetching gifts for org pulse:', giftsError)
      return { success: false, error: giftsError.message }
    }

    const totalRaised = gifts?.reduce((sum, gift) => sum + Number(gift.amount), 0) || 0

    // Get active donor count
    const { count: donorCount, error: donorCountError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    if (donorCountError) {
      console.error('Error fetching donor count:', donorCountError)
      return { success: false, error: donorCountError.message }
    }

    // Get shift IDs for the organization first (shift_signups doesn't have org_id directly)
    const { data: orgShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id')
      .eq('organization_id', organizationId)

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError)
      return { success: false, error: shiftsError.message }
    }

    const shiftIds = orgShifts?.map((s) => s.id) || []

    // Get volunteer hours from shift_signups
    let volunteerHours = 0
    if (shiftIds.length > 0) {
      const { data: signups, error: signupsError } = await supabase
        .from('shift_signups')
        .select('hours_logged')
        .in('shift_id', shiftIds)
        .in('status', ['completed', 'confirmed'])

      if (signupsError) {
        console.error('Error fetching shift signups:', signupsError)
      } else {
        volunteerHours = signups?.reduce((sum, signup) => sum + (signup.hours_logged || 0), 0) || 0
      }
    }

    // Get alert count (at-risk donors)
    const { count: alertCount, error: alertError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .in('lapse_risk', ['high', 'medium'])

    if (alertError) {
      console.error('Error fetching alert count:', alertError)
      return { success: false, error: alertError.message }
    }

    return {
      success: true,
      data: {
        totalRaised,
        donorCount: donorCount || 0,
        volunteerHours,
        alerts: alertCount || 0,
      },
    }
  } catch (error) {
    console.error('Error in getOrgPulse:', error)
    return { success: false, error: 'Failed to fetch organization pulse' }
  }
}
