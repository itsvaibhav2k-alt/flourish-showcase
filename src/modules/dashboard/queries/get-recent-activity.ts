'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface ActivityItem {
  id: string
  activityType: string
  description: string | null
  contactId: string
  contactFirstName: string
  contactLastName: string
  contactInitials: string
  occurredAt: string
  metadata?: Record<string, unknown>
}

export interface GetRecentActivityOptions {
  limit?: number
}

/**
 * Get recent activity feed for the dashboard
 * Shows latest interactions across contacts, gifts, shifts, and emails
 */
export async function getRecentActivity(
  options: GetRecentActivityOptions = {}
): Promise<ActivityItem[]> {
  const { limit = 10 } = options

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Fetch activities with contact information
    // Note: Using created_at column (renamed from occurred_at in migration 003)
    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        activity_type,
        description,
        contact_id,
        created_at,
        metadata,
        contacts!inner (
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activities:', error)
      throw new Error(error.message)
    }

    // Transform and format activities
    const formattedActivities: ActivityItem[] = (activities || []).map((activity) => {
      const contact = activity.contacts as { first_name: string; last_name: string }
      const firstName = contact.first_name
      const lastName = contact.last_name
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

      return {
        id: activity.id,
        activityType: activity.activity_type,
        description: activity.description,
        contactId: activity.contact_id,
        contactFirstName: firstName,
        contactLastName: lastName,
        contactInitials: initials,
        occurredAt: activity.created_at,
        metadata: activity.metadata as Record<string, unknown> | undefined,
      }
    })

    return formattedActivities
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    throw error
  }
}
