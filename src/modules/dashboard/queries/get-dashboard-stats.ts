'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface DashboardStats {
  totalContacts: number
  activeDonors: number
  totalVolunteers: number
  emailsSentThisMonth: number
  contactsChangePercent: number | null
  donorsChangePercent: number | null
  volunteersChangePercent: number | null
  totalDonations: number
  totalRaised: number
  monthlyRecurring: number
  // Sparkline data - last 7 data points for trends
  sparklineData: {
    totalRaised: number[]
    contacts: number[]
    volunteers: number[]
    emails: number[]
  }
}

/**
 * Get aggregate statistics for the dashboard
 * Includes total counts and month-over-month change percentages
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Get current month and previous month date boundaries
    const now = new Date()
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const firstDayOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    // Get total contacts count (non-archived)
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    // Get contacts created this month
    const { count: contactsThisMonth } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .gte('created_at', firstDayOfThisMonth.toISOString())

    // Get contacts created last month
    const { count: contactsLastMonth } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .gte('created_at', firstDayOfLastMonth.toISOString())
      .lt('created_at', firstDayOfThisMonth.toISOString())

    // Get active donors count (all contacts with is_donor=true)
    const { count: activeDonors } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)

    // Get active donors this month
    const { count: donorsThisMonth } = await supabase
      .from('gifts')
      .select('contact_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('gift_date', firstDayOfThisMonth.toISOString())

    // Get active donors last month
    const { count: donorsLastMonth } = await supabase
      .from('gifts')
      .select('contact_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('gift_date', firstDayOfLastMonth.toISOString())
      .lt('gift_date', firstDayOfThisMonth.toISOString())

    // Get total volunteers count
    const { count: totalVolunteers } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)
      .is('archived_at', null)

    // Get shift IDs for the organization first
    const { data: orgShifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('organization_id', organizationId)

    const shiftIds = orgShifts?.map((s) => s.id) || []

    // Get volunteers who signed up this month
    let volunteersThisMonth = 0
    if (shiftIds.length > 0) {
      const { count } = await supabase
        .from('shift_signups')
        .select('contact_id', { count: 'exact', head: true })
        .gte('created_at', firstDayOfThisMonth.toISOString())
        .in('status', ['confirmed', 'completed'])
        .in('shift_id', shiftIds)
      volunteersThisMonth = count || 0
    }

    // Get volunteers who signed up last month
    let volunteersLastMonth = 0
    if (shiftIds.length > 0) {
      const { count } = await supabase
        .from('shift_signups')
        .select('contact_id', { count: 'exact', head: true })
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lt('created_at', firstDayOfThisMonth.toISOString())
        .in('status', ['confirmed', 'completed'])
        .in('shift_id', shiftIds)
      volunteersLastMonth = count || 0
    }

    // Get emails sent this month
    const { count: emailsSentThisMonth } = await supabase
      .from('email_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'sent')
      .gte('sent_at', firstDayOfThisMonth.toISOString())

    // Get donation stats from gifts table (manual donations)
    const { data: completedGifts } = await supabase
      .from('gifts')
      .select('amount, gift_type')
      .eq('organization_id', organizationId)

    const totalDonations = completedGifts?.length || 0
    const totalRaised = completedGifts?.reduce((sum, g) => sum + Number(g.amount), 0) || 0
    const monthlyRecurring = completedGifts?.filter(g => g.gift_type === 'recurring').length || 0

    // Calculate percentage changes
    const contactsChangePercent = contactsLastMonth
      ? ((contactsThisMonth || 0) - (contactsLastMonth || 0)) / contactsLastMonth * 100
      : null

    const donorsChangePercent = donorsLastMonth
      ? ((donorsThisMonth || 0) - (donorsLastMonth || 0)) / donorsLastMonth * 100
      : null

    const volunteersChangePercent = volunteersLastMonth
      ? (volunteersThisMonth - volunteersLastMonth) / volunteersLastMonth * 100
      : null

    // Get sparkline data - cumulative totals for the last 7 weeks
    const sparklineData = await getSparklineData(supabase, organizationId, shiftIds)

    return {
      totalContacts: totalContacts || 0,
      activeDonors: activeDonors || 0,
      totalVolunteers: totalVolunteers || 0,
      emailsSentThisMonth: emailsSentThisMonth || 0,
      contactsChangePercent: contactsChangePercent ? Math.round(contactsChangePercent) : null,
      donorsChangePercent: donorsChangePercent ? Math.round(donorsChangePercent) : null,
      volunteersChangePercent: volunteersChangePercent ? Math.round(volunteersChangePercent) : null,
      totalDonations,
      totalRaised, // Gifts are stored in dollars
      monthlyRecurring,
      sparklineData,
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    throw error
  }
}

/**
 * Get sparkline trend data for the last 7 weeks
 * Returns cumulative totals at each week boundary
 */
async function getSparklineData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  shiftIds: string[]
): Promise<DashboardStats['sparklineData']> {
  const now = new Date()
  const weekBoundaries: Date[] = []

  // Create 7 week boundaries going back
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - (i * 7))
    weekBoundaries.push(date)
  }

  // Get cumulative totals at each boundary
  const [raisedData, contactsData, volunteersData, emailsData] = await Promise.all([
    // Total raised over time (cumulative gift amounts by week)
    Promise.all(weekBoundaries.map(async (boundary) => {
      const { data } = await supabase
        .from('gifts')
        .select('amount')
        .eq('organization_id', organizationId)
        .lte('gift_date', boundary.toISOString())
      return data?.reduce((sum, g) => sum + Number(g.amount), 0) || 0
    })),

    // Contacts count over time (cumulative)
    Promise.all(weekBoundaries.map(async (boundary) => {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .is('archived_at', null)
        .lte('created_at', boundary.toISOString())
      return count || 0
    })),

    // Volunteers count over time (cumulative)
    Promise.all(weekBoundaries.map(async (boundary) => {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_volunteer', true)
        .is('archived_at', null)
        .lte('created_at', boundary.toISOString())
      return count || 0
    })),

    // Emails sent over time (cumulative)
    Promise.all(weekBoundaries.map(async (boundary) => {
      const { count } = await supabase
        .from('email_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'sent')
        .lte('sent_at', boundary.toISOString())
      return count || 0
    })),
  ])

  return {
    totalRaised: raisedData,
    contacts: contactsData,
    volunteers: volunteersData,
    emails: emailsData,
  }
}
