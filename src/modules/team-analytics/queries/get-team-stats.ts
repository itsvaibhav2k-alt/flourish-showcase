'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export type DateRangeType = '7d' | '30d' | '90d' | 'all'

export interface TeamMemberStats {
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  member_since: string
  contacts_added: number
  gifts_recorded: number
  gift_amount: number
  emails_sent: number
  notes_added: number
  total_activities: number
}

export interface TeamOverviewStats {
  total_team_members: number
  total_activities: number
  total_contacts_added: number
  total_gifts_recorded: number
  total_gift_amount: number
  total_emails_sent: number
  total_notes_added: number
  most_active_member: TeamMemberStats | null
}

/**
 * Get aggregated team statistics for a specific date range
 */
export async function getTeamStats(
  dateRange: DateRangeType = '30d'
): Promise<{
  overview: TeamOverviewStats
  members: TeamMemberStats[]
}> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Determine which columns to use based on date range
    const suffix = dateRange === 'all' ? 'all' : dateRange

    // Query the materialized view
    const { data: teamData, error } = await supabase
      .from('team_activity_stats')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching team stats:', error)
      throw new Error('Failed to fetch team statistics')
    }

    if (!teamData || teamData.length === 0) {
      return {
        overview: {
          total_team_members: 0,
          total_activities: 0,
          total_contacts_added: 0,
          total_gifts_recorded: 0,
          total_gift_amount: 0,
          total_emails_sent: 0,
          total_notes_added: 0,
          most_active_member: null,
        },
        members: [],
      }
    }

    // Map the data to the correct columns based on date range
    const members: TeamMemberStats[] = teamData.map((member: any) => {
      const contacts = member[`contacts_added_${suffix}`] || 0
      const gifts = member[`gifts_recorded_${suffix}`] || 0
      const giftAmount = suffix === '30d' || suffix === 'all'
        ? member[`gift_amount_${suffix}`] || 0
        : 0
      const emails = member[`emails_sent_${suffix}`] || 0
      const notes = member[`notes_added_${suffix}`] || 0

      return {
        user_id: member.user_id,
        email: member.email,
        full_name: member.full_name,
        avatar_url: member.avatar_url,
        role: member.role,
        member_since: member.member_since,
        contacts_added: contacts,
        gifts_recorded: gifts,
        gift_amount: giftAmount,
        emails_sent: emails,
        notes_added: notes,
        total_activities: contacts + gifts + emails + notes,
      }
    })

    // Sort by total activities descending
    members.sort((a, b) => b.total_activities - a.total_activities)

    // Calculate overview stats
    const overview: TeamOverviewStats = {
      total_team_members: members.length,
      total_activities: members.reduce((sum, m) => sum + m.total_activities, 0),
      total_contacts_added: members.reduce((sum, m) => sum + m.contacts_added, 0),
      total_gifts_recorded: members.reduce((sum, m) => sum + m.gifts_recorded, 0),
      total_gift_amount: members.reduce((sum, m) => sum + m.gift_amount, 0),
      total_emails_sent: members.reduce((sum, m) => sum + m.emails_sent, 0),
      total_notes_added: members.reduce((sum, m) => sum + m.notes_added, 0),
      most_active_member: members[0] || null,
    }

    return {
      overview,
      members,
    }
  } catch (error) {
    console.error('Error in getTeamStats:', error)
    throw error
  }
}
