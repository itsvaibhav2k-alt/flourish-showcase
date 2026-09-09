'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface ImpactStoryData {
  id: string
  contact_id: string
  organization_id: string
  time_period: string
  total_giving: number
  headline: string | null
  narrative: string | null
  impact_breakdown: Record<string, number> | null
  card_image_url: string | null
  share_token: string | null
  generated_at: string
  created_at: string
}

export interface ImpactStoryWithDetails extends ImpactStoryData {
  contact: {
    first_name: string
    last_name: string
  }
  organization: {
    name: string
    logo_url: string | null
  }
}

/**
 * Server function to fetch impact story for a contact
 * Optionally filter by time period
 */
export async function getImpactStory(
  contactId: string,
  timePeriod?: string
): Promise<ImpactStoryData | null> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Build query
    let query = supabase
      .from('impact_stories')
      .select('*')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)

    // Filter by time period if provided
    if (timePeriod) {
      query = query.eq('time_period', timePeriod)
    }

    // Get the most recent story if multiple exist
    query = query.order('generated_at', { ascending: false }).limit(1)

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Error fetching impact story:', error)
      throw new Error('Failed to fetch impact story')
    }

    return data
  } catch (error) {
    console.error('Error in getImpactStory:', error)
    throw error
  }
}

/**
 * Server function to fetch impact story by share token (public access)
 * This uses RLS policy to allow public viewing via share token
 */
export async function getImpactStoryByToken(
  token: string
): Promise<ImpactStoryWithDetails | null> {
  try {
    // Use admin client to bypass RLS and fetch related data
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('impact_stories')
      .select(`
        *,
        contact:contacts!inner(first_name, last_name),
        organization:organizations!inner(name, logo_url)
      `)
      .eq('share_token', token)
      .maybeSingle()

    if (error) {
      console.error('Error fetching impact story by token:', error)
      throw new Error('Failed to fetch impact story')
    }

    if (!data) {
      return null
    }

    // Format the response
    return {
      id: data.id,
      contact_id: data.contact_id,
      organization_id: data.organization_id,
      time_period: data.time_period,
      total_giving: data.total_giving,
      headline: data.headline,
      narrative: data.narrative,
      impact_breakdown: data.impact_breakdown,
      card_image_url: data.card_image_url,
      share_token: data.share_token,
      generated_at: data.generated_at,
      created_at: data.created_at,
      contact: data.contact as any,
      organization: data.organization as any,
    }
  } catch (error) {
    console.error('Error in getImpactStoryByToken:', error)
    throw error
  }
}

/**
 * Server function to fetch all impact stories for a contact
 */
export async function getImpactStoriesForContact(
  contactId: string
): Promise<ImpactStoryData[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('impact_stories')
      .select('*')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('Error fetching impact stories:', error)
      throw new Error('Failed to fetch impact stories')
    }

    return data || []
  } catch (error) {
    console.error('Error in getImpactStoriesForContact:', error)
    throw error
  }
}

/**
 * Server function to check if a contact has an impact story
 */
export async function hasImpactStory(
  contactId: string,
  timePeriod?: string
): Promise<boolean> {
  try {
    const story = await getImpactStory(contactId, timePeriod)
    return story !== null
  } catch (error) {
    console.error('Error in hasImpactStory:', error)
    return false
  }
}
