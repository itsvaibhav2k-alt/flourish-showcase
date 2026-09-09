/**
 * Context Builder for AI Email Generation
 *
 * Assembles donor and volunteer context from the database for use in AI prompts.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface DonorContext {
  donor: {
    firstName: string
    lastName: string
    email: string
    fullName: string
  }
  giving: {
    lifetimeGiving: number
    totalGifts: number
    lastGiftDate: string | null
    avgGift: number
    lastGiftAmount: number | null
    recentGifts: Array<{
      amount: number
      date: string
      campaign: string | null
    }>
  }
  relationship: {
    segment: string
    engagementScore: number
    yearsOfSupport: number
    tags: string[]
  }
  recentActivities: Array<{
    activityType: string
    date: string
    description: string | null
  }>
}

export interface VolunteerContext {
  volunteer: {
    firstName: string
    lastName: string
    email: string
    fullName: string
  }
  volunteerHistory: {
    totalShifts: number
    totalHours: number
    noShowCount: number
    lastShiftDate: string | null
    upcomingShifts: number
  }
  currentShift?: {
    title: string
    date: string
    startTime: string
    endTime: string
    location: string | null
    description: string | null
  }
  relationship: {
    tags: string[]
  }
}

export interface GiftContext {
  amount: number
  date: string
  campaign: string | null
  giftType: string | null
  paymentMethod: string | null
}

export interface OrganizationVoiceContext {
  tonePreset: string
  snippets: Array<{
    name: string
    content: string
  }>
}

/**
 * Build comprehensive donor context for email generation
 */
export async function buildDonorContext(
  contactId: string
): Promise<DonorContext> {
  const supabase = await createClient()

  // Fetch contact details
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    throw new Error(`Failed to fetch contact: ${contactError?.message}`)
  }

  // Fetch all gifts
  const { data: gifts, error: giftsError } = await supabase
    .from('gifts')
    .select('*')
    .eq('contact_id', contactId)
    .order('gift_date', { ascending: false })

  if (giftsError) {
    throw new Error(`Failed to fetch gifts: ${giftsError.message}`)
  }

  // Fetch recent activities
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (activitiesError) {
    throw new Error(`Failed to fetch activities: ${activitiesError.message}`)
  }

  // Calculate giving metrics
  const lifetimeGiving = gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0
  const totalGifts = gifts?.length || 0
  const avgGift = totalGifts > 0 ? lifetimeGiving / totalGifts : 0
  const lastGift = gifts?.[0]
  const recentGifts = gifts?.slice(0, 5).map(gift => ({
    amount: gift.amount,
    date: gift.gift_date,
    campaign: gift.campaign,
  })) || []

  // Calculate years of support
  const firstGiftDate = gifts?.[gifts.length - 1]?.gift_date
  const yearsOfSupport = firstGiftDate
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(firstGiftDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        )
      )
    : 0

  // Determine donor segment
  const segment = determineDonorSegment(lifetimeGiving, totalGifts)

  // Calculate engagement score (0-100)
  const engagementScore = calculateEngagementScore({
    totalGifts,
    recentGifts: gifts?.filter(
      g =>
        new Date(g.gift_date) >
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ).length || 0,
    yearsOfSupport,
    hasRecentActivity: activities && activities.length > 0,
  })

  return {
    donor: {
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email || '',
      fullName: `${contact.first_name} ${contact.last_name}`,
    },
    giving: {
      lifetimeGiving,
      totalGifts,
      lastGiftDate: lastGift?.gift_date || null,
      avgGift,
      lastGiftAmount: lastGift?.amount || null,
      recentGifts,
    },
    relationship: {
      segment,
      engagementScore,
      yearsOfSupport,
      tags: contact.tags || [],
    },
    recentActivities:
      activities?.map(a => ({
        activityType: a.activity_type,
        date: a.created_at,
        description: a.description,
      })) || [],
  }
}

/**
 * Build volunteer context for email generation
 */
export async function buildVolunteerContext(
  contactId: string,
  shiftId?: string
): Promise<VolunteerContext> {
  const supabase = await createClient()

  // Fetch contact details
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    throw new Error(`Failed to fetch contact: ${contactError?.message}`)
  }

  // Fetch volunteer history
  const { data: signups, error: signupsError } = await supabase
    .from('shift_signups')
    .select('*, shifts(*)')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  if (signupsError) {
    throw new Error(`Failed to fetch signups: ${signupsError.message}`)
  }

  // Calculate volunteer metrics
  const totalShifts =
    signups?.filter(s => s.status === 'confirmed' && s.checked_in_at).length ||
    0
  const totalHours =
    signups?.reduce((sum, s) => sum + (s.hours_logged || 0), 0) || 0
  const noShowCount = signups?.filter(s => s.no_show).length || 0

  const completedShifts = signups?.filter(s => s.checked_in_at) || []
  const lastShiftDate =
    completedShifts.length > 0
      ? completedShifts[0].shifts?.start_time || null
      : null

  const upcomingShifts =
    signups?.filter(
      s =>
        s.status === 'confirmed' &&
        !s.checked_in_at &&
        s.shifts &&
        new Date(s.shifts.start_time) > new Date()
    ).length || 0

  // Fetch current shift details if shiftId provided
  let currentShift
  if (shiftId) {
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single()

    if (shiftError) {
      throw new Error(`Failed to fetch shift: ${shiftError.message}`)
    }

    currentShift = {
      title: shift.title,
      date: new Date(shift.start_time).toLocaleDateString(),
      startTime: new Date(shift.start_time).toLocaleTimeString(),
      endTime: new Date(shift.end_time).toLocaleTimeString(),
      location: shift.location,
      description: shift.description,
    }
  }

  return {
    volunteer: {
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email || '',
      fullName: `${contact.first_name} ${contact.last_name}`,
    },
    volunteerHistory: {
      totalShifts,
      totalHours,
      noShowCount,
      lastShiftDate,
      upcomingShifts,
    },
    currentShift,
    relationship: {
      tags: contact.tags || [],
    },
  }
}

/**
 * Get organization voice context (tone and snippets)
 */
export async function getOrganizationVoiceContext(): Promise<OrganizationVoiceContext> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data: org, error } = await supabase
      .from('organizations')
      .select('tone_preset, snippets')
      .eq('id', organizationId)
      .single()

    if (error || !org) {
      console.error('Error fetching organization voice context:', error)
      return {
        tonePreset: 'warm',
        snippets: [],
      }
    }

    return {
      tonePreset: org.tone_preset || 'warm',
      snippets: (org.snippets as Array<{ name: string; content: string }>) || [],
    }
  } catch (error) {
    console.error('Error in getOrganizationVoiceContext:', error)
    return {
      tonePreset: 'warm',
      snippets: [],
    }
  }
}

/**
 * Serialize organization voice context into a prompt-friendly format
 */
export function serializeOrganizationVoiceContext(
  voiceContext: OrganizationVoiceContext
): string {
  let context = `ORGANIZATION VOICE SETTINGS:
Tone Preset: ${voiceContext.tonePreset}
`

  if (voiceContext.snippets && voiceContext.snippets.length > 0) {
    context += '\nREUSABLE CONTENT SNIPPETS:\n'
    context += 'You may reference or incorporate these approved snippets when appropriate:\n\n'

    voiceContext.snippets.forEach(snippet => {
      context += `[${snippet.name}]\n${snippet.content}\n\n`
    })
  }

  return context
}

/**
 * Serialize context into a prompt-friendly format
 */
export function serializeContext(
  context: DonorContext | VolunteerContext
): string {
  if ('giving' in context) {
    // Donor context
    return `DONOR INFORMATION:
Name: ${context.donor.fullName}
Email: ${context.donor.email}

GIVING HISTORY:
- Lifetime Giving: $${context.giving.lifetimeGiving.toFixed(2)}
- Total Gifts: ${context.giving.totalGifts}
- Average Gift: $${context.giving.avgGift.toFixed(2)}
- Last Gift: ${context.giving.lastGiftAmount ? `$${context.giving.lastGiftAmount.toFixed(2)}` : 'N/A'} on ${context.giving.lastGiftDate || 'N/A'}
- Recent Gifts: ${context.giving.recentGifts.map(g => `$${g.amount.toFixed(2)} on ${g.date}${g.campaign ? ` (${g.campaign})` : ''}`).join(', ')}

RELATIONSHIP:
- Donor Segment: ${context.relationship.segment}
- Engagement Score: ${context.relationship.engagementScore}/100
- Years of Support: ${context.relationship.yearsOfSupport}
- Tags: ${context.relationship.tags.join(', ') || 'None'}

RECENT ACTIVITIES:
${context.recentActivities.length > 0 ? context.recentActivities.map(a => `- ${a.activityType} on ${a.date}: ${a.description || 'No description'}`).join('\n') : '- No recent activities'}
`
  } else {
    // Volunteer context
    return `VOLUNTEER INFORMATION:
Name: ${context.volunteer.fullName}
Email: ${context.volunteer.email}

VOLUNTEER HISTORY:
- Total Shifts Completed: ${context.volunteerHistory.totalShifts}
- Total Hours: ${context.volunteerHistory.totalHours}
- No-Shows: ${context.volunteerHistory.noShowCount}
- Last Shift: ${context.volunteerHistory.lastShiftDate || 'N/A'}
- Upcoming Shifts: ${context.volunteerHistory.upcomingShifts}

${context.currentShift ? `CURRENT SHIFT:
- Title: ${context.currentShift.title}
- Date: ${context.currentShift.date}
- Time: ${context.currentShift.startTime} - ${context.currentShift.endTime}
- Location: ${context.currentShift.location || 'TBD'}
- Description: ${context.currentShift.description || 'N/A'}
` : ''}

RELATIONSHIP:
- Tags: ${context.relationship.tags.join(', ') || 'None'}
`
  }
}

/**
 * Determine donor segment based on giving history
 */
function determineDonorSegment(
  lifetimeGiving: number,
  totalGifts: number
): string {
  if (lifetimeGiving >= 10000) return 'Major Donor'
  if (lifetimeGiving >= 5000) return 'Leadership Donor'
  if (lifetimeGiving >= 1000) return 'Sustaining Donor'
  if (totalGifts >= 3) return 'Regular Donor'
  if (totalGifts >= 1) return 'First-Time Donor'
  return 'Prospect'
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(params: {
  totalGifts: number
  recentGifts: number
  yearsOfSupport: number
  hasRecentActivity: boolean
}): number {
  let score = 0

  // Recent giving (0-40 points)
  score += Math.min(40, params.recentGifts * 10)

  // Lifetime giving (0-30 points)
  score += Math.min(30, params.totalGifts * 3)

  // Years of support (0-20 points)
  score += Math.min(20, params.yearsOfSupport * 4)

  // Recent activity (0-10 points)
  if (params.hasRecentActivity) score += 10

  return Math.min(100, score)
}
