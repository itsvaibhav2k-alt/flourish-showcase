/**
 * Get Contact Activities Query
 *
 * Fetches activity history for a contact, ordered by most recent first
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Database } from '@/lib/supabase/types'

type Activity = Database['public']['Tables']['activities']['Row']

export interface ContactActivity extends Activity {
  // Extended with any joined data if needed
}

export interface GetContactActivitiesOptions {
  contactId: string
  limit?: number
  offset?: number
  activityType?: string
}

export interface GetContactActivitiesResult {
  activities: ContactActivity[]
  total: number
}

/**
 * Fetch activities for a specific contact
 *
 * @param options - Query options
 * @returns Promise with activities and total count
 */
export async function getContactActivities(
  options: GetContactActivitiesOptions
): Promise<GetContactActivitiesResult | null> {
  try {
    const { contactId, limit = 50, offset = 0, activityType } = options

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return null
    }

    const supabase = await createClient()

    // Build the query
    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })

    // Filter by activity type if provided
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching contact activities:', error)
      return null
    }

    return {
      activities: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Unexpected error fetching contact activities:', error)
    return null
  }
}

/**
 * Fetch recent activities across all contacts in an organization
 *
 * @param limit - Number of activities to fetch (default: 20)
 * @returns Promise with activities or null
 */
export async function getRecentActivities(
  limit = 20
): Promise<ContactActivity[] | null> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent activities:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching recent activities:', error)
    return null
  }
}

/**
 * Get activity count by type for a contact
 *
 * @param contactId - Contact ID
 * @returns Promise with activity counts by type
 */
export async function getActivityCountsByType(
  contactId: string
): Promise<Record<string, number> | null> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return null
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('activities')
      .select('activity_type')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)

    if (error) {
      console.error('Error fetching activity counts:', error)
      return null
    }

    // Count activities by type
    const counts: Record<string, number> = {}
    data.forEach(activity => {
      const type = activity.activity_type
      counts[type] = (counts[type] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error('Unexpected error fetching activity counts:', error)
    return null
  }
}
