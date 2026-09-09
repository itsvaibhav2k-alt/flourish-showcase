'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { TeamMemberStats, TeamOverviewStats } from '../schemas/types'

/**
 * Get team member statistics
 */
export async function getTeamMemberStats(): Promise<TeamMemberStats[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  // Get team members
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id, role, created_at')
    .eq('organization_id', organizationId)

  if (membersError || !members) {
    console.error('Error fetching team members:', membersError)
    return []
  }

  const memberStats: TeamMemberStats[] = []

  for (const member of members) {
    // Get user info
    const { data: userProfile } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', member.user_id)
      .single()

    // Get email stats for this user
    const { count: emailsDrafted } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .or(`reviewed_by.eq.${member.user_id},sent_by.eq.${member.user_id}`)

    const { count: emailsSent } = await supabase
      .from('email_drafts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('sent_by', member.user_id)
      .not('sent_at', 'is', null)

    // Get copilot actions completed
    const { count: copilotActions } = await supabase
      .from('copilot_actions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('completed_by', member.user_id)

    // Get last activity from email_drafts (most reliable indicator of user activity)
    const { data: lastEmailActivity } = await supabase
      .from('email_drafts')
      .select('sent_at, created_at')
      .eq('organization_id', organizationId)
      .eq('sent_by', member.user_id)
      .order('sent_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    memberStats.push({
      userId: member.user_id,
      email: userProfile?.email || member.user_id,
      name: userProfile?.name || null,
      role: member.role as 'admin' | 'member' | 'viewer',
      emailsDrafted: emailsDrafted || 0,
      emailsSent: emailsSent || 0,
      contactsAdded: 0, // Would need to track who added contacts
      giftsRecorded: 0, // Would need to track who recorded gifts
      copilotActionsCompleted: copilotActions || 0,
      lastActive: lastEmailActivity?.sent_at || lastEmailActivity?.created_at || member.created_at,
    })
  }

  return memberStats.sort((a, b) => (b.emailsSent || 0) - (a.emailsSent || 0))
}

/**
 * Get team overview statistics
 */
export async function getTeamOverviewStats(): Promise<TeamOverviewStats> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return {
      totalMembers: 0,
      totalEmailsSent: 0,
      totalContactsAdded: 0,
      totalGiftsRecorded: 0,
      activeThisWeek: 0,
    }
  }

  const supabase = await createClient()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get member count
  const { count: totalMembers } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Get emails sent
  const { count: totalEmailsSent } = await supabase
    .from('email_drafts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .not('sent_at', 'is', null)

  // Get contacts added this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: totalContactsAdded } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString())

  // Get gifts this month
  const { count: totalGiftsRecorded } = await supabase
    .from('gifts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString())

  // Get active members this week (based on email activity)
  const { data: activeEmails } = await supabase
    .from('email_drafts')
    .select('sent_by')
    .eq('organization_id', organizationId)
    .gte('sent_at', oneWeekAgo)
    .not('sent_by', 'is', null)

  const uniqueActiveMembers = new Set(activeEmails?.map((e) => e.sent_by).filter(Boolean) || [])

  return {
    totalMembers: totalMembers || 0,
    totalEmailsSent: totalEmailsSent || 0,
    totalContactsAdded: totalContactsAdded || 0,
    totalGiftsRecorded: totalGiftsRecorded || 0,
    activeThisWeek: uniqueActiveMembers.size,
  }
}

/**
 * Get email activity over time (last 30 days)
 */
export async function getEmailActivityTimeline(): Promise<
  Array<{ date: string; drafted: number; sent: number }>
> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: drafts } = await supabase
    .from('email_drafts')
    .select('created_at, sent_at')
    .eq('organization_id', organizationId)
    .gte('created_at', thirtyDaysAgo)

  if (!drafts) return []

  // Group by date
  const dateMap = new Map<string, { drafted: number; sent: number }>()

  for (const draft of drafts) {
    const draftDate = draft.created_at.split('T')[0]
    const existing = dateMap.get(draftDate) || { drafted: 0, sent: 0 }
    existing.drafted++
    dateMap.set(draftDate, existing)

    if (draft.sent_at) {
      const sentDate = draft.sent_at.split('T')[0]
      const sentExisting = dateMap.get(sentDate) || { drafted: 0, sent: 0 }
      sentExisting.sent++
      dateMap.set(sentDate, sentExisting)
    }
  }

  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
