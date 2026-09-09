/**
 * AI Tiles Context Builder
 *
 * Efficiently aggregates organization data for AI tile generation.
 * Uses optimized queries with joins to minimize database roundtrips.
 */

import { createClient } from '@/lib/supabase/server'

export interface TileContext {
  organizationName: string
  donorSummary?: {
    totalDonors: number
    activeDonors: number
    lapsedDonors: number
    atRiskDonors: number
    averageGift: number
    totalGiftsThisYear: number
    totalRaisedThisYear: number
    topDonors: Array<{ name: string; totalGiven: number; lastGift: Date }>
    recentGifts: Array<{
      donorName: string
      amount: number
      date: string
      campaign: string | null
    }>
  }
  volunteerSummary?: {
    totalVolunteers: number
    activeVolunteers: number
    upcomingShifts: number
    hoursThisMonth: number
    recentSignups: Array<{
      volunteerName: string
      shiftTitle: string
      date: string
    }>
  }
  recentActivity?: {
    newDonors: number
    newGifts: number
    emailsSent: number
    volunteersSignedUp: number
  }
  timeFrame: {
    startOfYear: string
    startOfMonth: string
    startOfWeek: string
    now: string
  }
}

/**
 * Build comprehensive tile context based on requested data sources
 */
export async function buildTileContext(
  organizationId: string,
  dataSources: string[]
): Promise<TileContext> {
  const supabase = await createClient()

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  // Set up time frames for queries
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())

  const timeFrame = {
    startOfYear: startOfYear.toISOString(),
    startOfMonth: startOfMonth.toISOString(),
    startOfWeek: startOfWeek.toISOString(),
    now: now.toISOString(),
  }

  const context: TileContext = {
    organizationName: org?.name || 'Your Organization',
    timeFrame,
  }

  // Build donor summary if requested
  if (dataSources.includes('donors')) {
    context.donorSummary = await buildDonorSummary(
      supabase,
      organizationId,
      timeFrame
    )
  }

  // Build volunteer summary if requested
  if (dataSources.includes('volunteers')) {
    context.volunteerSummary = await buildVolunteerSummary(
      supabase,
      organizationId,
      timeFrame
    )
  }

  // Build recent activity summary if requested
  if (dataSources.includes('activity')) {
    context.recentActivity = await buildRecentActivity(
      supabase,
      organizationId,
      timeFrame
    )
  }

  return context
}

/**
 * Build donor summary data
 */
async function buildDonorSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  timeFrame: TileContext['timeFrame']
) {
  // Get all donors with their giving stats
  const { data: donors } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, lapse_risk, last_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)

  const totalDonors = donors?.length || 0

  // Count lapsed and at-risk donors
  const lapsedDonors = donors?.filter(d => d.lapse_risk === 'lapsed').length || 0
  const atRiskDonors = donors?.filter(d =>
    d.lapse_risk === 'high' || d.lapse_risk === 'medium'
  ).length || 0

  // Count active donors (gave in last 12 months)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const activeDonors = donors?.filter(d =>
    d.last_gift_date && new Date(d.last_gift_date) > oneYearAgo
  ).length || 0

  // Get all gifts for the year with donor info
  const { data: giftsThisYear } = await supabase
    .from('gifts')
    .select(`
      amount,
      gift_date,
      campaign,
      contact_id,
      contacts!inner(first_name, last_name)
    `)
    .eq('organization_id', organizationId)
    .gte('gift_date', timeFrame.startOfYear)
    .order('gift_date', { ascending: false })

  const totalGiftsThisYear = giftsThisYear?.length || 0
  const totalRaisedThisYear = giftsThisYear?.reduce(
    (sum, gift) => sum + gift.amount,
    0
  ) || 0
  const averageGift = totalGiftsThisYear > 0
    ? totalRaisedThisYear / totalGiftsThisYear
    : 0

  // Get recent gifts (last 10)
  const recentGifts = (giftsThisYear?.slice(0, 10) || []).map(gift => {
    const contact = Array.isArray(gift.contacts) ? gift.contacts[0] : gift.contacts
    return {
      donorName: contact
        ? `${contact.first_name} ${contact.last_name}`
        : 'Unknown',
      amount: gift.amount,
      date: gift.gift_date,
      campaign: gift.campaign,
    }
  })

  // Calculate top donors for the year
  const donorTotals = new Map<string, { name: string; total: number; lastGift: Date }>()

  giftsThisYear?.forEach(gift => {
    const contact = Array.isArray(gift.contacts) ? gift.contacts[0] : gift.contacts
    if (!contact) return

    const donorId = gift.contact_id
    const name = `${contact.first_name} ${contact.last_name}`
    const existing = donorTotals.get(donorId)

    if (existing) {
      existing.total += gift.amount
      const giftDate = new Date(gift.gift_date)
      if (giftDate > existing.lastGift) {
        existing.lastGift = giftDate
      }
    } else {
      donorTotals.set(donorId, {
        name,
        total: gift.amount,
        lastGift: new Date(gift.gift_date),
      })
    }
  })

  const topDonors = Array.from(donorTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(d => ({
      name: d.name,
      totalGiven: d.total,
      lastGift: d.lastGift,
    }))

  return {
    totalDonors,
    activeDonors,
    lapsedDonors,
    atRiskDonors,
    averageGift,
    totalGiftsThisYear,
    totalRaisedThisYear,
    topDonors,
    recentGifts,
  }
}

/**
 * Build volunteer summary data
 */
async function buildVolunteerSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  timeFrame: TileContext['timeFrame']
) {
  // Get total volunteers
  const { count: totalVolunteers } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_volunteer', true)

  // Get signups for this month with volunteer info
  const { data: signupsThisMonth } = await supabase
    .from('shift_signups')
    .select(`
      hours_logged,
      created_at,
      contact_id,
      shifts!inner(
        organization_id,
        title,
        start_time
      ),
      contacts!inner(first_name, last_name)
    `)
    .eq('shifts.organization_id', organizationId)
    .gte('created_at', timeFrame.startOfMonth)

  const hoursThisMonth = signupsThisMonth?.reduce(
    (sum, s) => sum + (s.hours_logged || 0),
    0
  ) || 0

  // Count active volunteers (signed up in last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: recentSignups } = await supabase
    .from('shift_signups')
    .select('contact_id')
    .eq('shifts.organization_id', organizationId)
    .gte('created_at', threeMonthsAgo.toISOString())

  const activeVolunteerIds = new Set(recentSignups?.map(s => s.contact_id) || [])
  const activeVolunteers = activeVolunteerIds.size

  // Count upcoming shifts
  const { count: upcomingShifts } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('start_time', timeFrame.now)

  // Get recent signups (last 5)
  const recentSignupsList = (signupsThisMonth?.slice(0, 5) || []).map(signup => {
    const contact = Array.isArray(signup.contacts) ? signup.contacts[0] : signup.contacts
    const shift = Array.isArray(signup.shifts) ? signup.shifts[0] : signup.shifts

    return {
      volunteerName: contact
        ? `${contact.first_name} ${contact.last_name}`
        : 'Unknown',
      shiftTitle: shift?.title || 'Unknown Shift',
      date: shift?.start_time || signup.created_at,
    }
  })

  return {
    totalVolunteers: totalVolunteers || 0,
    activeVolunteers,
    upcomingShifts: upcomingShifts || 0,
    hoursThisMonth: Math.round(hoursThisMonth * 100) / 100,
    recentSignups: recentSignupsList,
  }
}

/**
 * Build recent activity summary
 */
async function buildRecentActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  timeFrame: TileContext['timeFrame']
) {
  // Count new donors this month (donors whose first gift is this month)
  const { data: donorsWithFirstGifts } = await supabase
    .from('contacts')
    .select('id, first_gift_date')
    .eq('organization_id', organizationId)
    .eq('is_donor', true)
    .gte('first_gift_date', timeFrame.startOfMonth)

  const newDonors = donorsWithFirstGifts?.length || 0

  // Count new gifts this month
  const { count: newGifts } = await supabase
    .from('gifts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('gift_date', timeFrame.startOfMonth)

  // Count emails sent this month
  const { count: emailsSent } = await supabase
    .from('email_drafts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'sent')
    .gte('sent_at', timeFrame.startOfMonth)

  // Count volunteer signups this month
  const { data: volunteersSignedUpData } = await supabase
    .from('shift_signups')
    .select('contact_id, shifts!inner(organization_id)')
    .eq('shifts.organization_id', organizationId)
    .gte('created_at', timeFrame.startOfMonth)

  const volunteersSignedUp = volunteersSignedUpData?.length || 0

  return {
    newDonors,
    newGifts: newGifts || 0,
    emailsSent: emailsSent || 0,
    volunteersSignedUp,
  }
}

/**
 * Serialize context for AI prompts
 */
export function serializeTileContext(context: TileContext): string {
  let prompt = `ORGANIZATION: ${context.organizationName}\n\n`

  if (context.donorSummary) {
    const d = context.donorSummary
    prompt += `DONOR METRICS (Year to Date):
- Total Donors: ${d.totalDonors}
- Active Donors (gave in last 12 months): ${d.activeDonors}
- At-Risk Donors: ${d.atRiskDonors}
- Lapsed Donors: ${d.lapsedDonors}
- Total Raised This Year: $${d.totalRaisedThisYear.toFixed(2)}
- Total Gifts This Year: ${d.totalGiftsThisYear}
- Average Gift: $${d.averageGift.toFixed(2)}

Top Donors This Year:
${d.topDonors.map(donor => `- ${donor.name}: $${donor.totalGiven.toFixed(2)} (last gift: ${donor.lastGift.toLocaleDateString()})`).join('\n')}

Recent Gifts (last 10):
${d.recentGifts.map(gift => `- ${gift.donorName}: $${gift.amount.toFixed(2)} on ${new Date(gift.date).toLocaleDateString()}${gift.campaign ? ` (${gift.campaign})` : ''}`).join('\n')}

`
  }

  if (context.volunteerSummary) {
    const v = context.volunteerSummary
    prompt += `VOLUNTEER METRICS:
- Total Volunteers: ${v.totalVolunteers}
- Active Volunteers (last 3 months): ${v.activeVolunteers}
- Upcoming Shifts: ${v.upcomingShifts}
- Hours This Month: ${v.hoursThisMonth}

Recent Volunteer Signups:
${v.recentSignups.map(s => `- ${s.volunteerName} signed up for "${s.shiftTitle}" on ${new Date(s.date).toLocaleDateString()}`).join('\n')}

`
  }

  if (context.recentActivity) {
    const a = context.recentActivity
    prompt += `RECENT ACTIVITY (This Month):
- New Donors: ${a.newDonors}
- New Gifts: ${a.newGifts}
- Emails Sent: ${a.emailsSent}
- Volunteer Signups: ${a.volunteersSignedUp}

`
  }

  prompt += `TIME FRAME:
- Current Date: ${new Date(context.timeFrame.now).toLocaleDateString()}
- Start of Year: ${new Date(context.timeFrame.startOfYear).toLocaleDateString()}
- Start of Month: ${new Date(context.timeFrame.startOfMonth).toLocaleDateString()}
- Start of Week: ${new Date(context.timeFrame.startOfWeek).toLocaleDateString()}`

  return prompt
}
