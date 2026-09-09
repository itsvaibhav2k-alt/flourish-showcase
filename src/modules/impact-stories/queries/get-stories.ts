/**
 * Get Impact Stories Query
 *
 * Fetches impact stories for an organization
 */

import { createClient } from '@/lib/supabase/server'
import type { ImpactStory } from '../schemas'

export interface GetStoriesParams {
  organizationId: string
  contactId?: string
  limit?: number
  offset?: number
}

export interface StoryWithContact extends ImpactStory {
  contact?: {
    first_name: string
    last_name: string
    email: string
  }
}

/**
 * Get impact stories for an organization
 */
export async function getStories(
  params: GetStoriesParams
): Promise<{ stories: StoryWithContact[]; total: number }> {
  const { organizationId, contactId, limit = 50, offset = 0 } = params

  const supabase = await createClient()

  let query = supabase
    .from('impact_stories')
    .select(
      `
      *,
      contact:contacts(first_name, last_name, email)
    `,
      { count: 'exact' }
    )
    .eq('organization_id', organizationId)

  if (contactId) {
    query = query.eq('contact_id', contactId)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching impact stories:', error)
    throw new Error('Failed to fetch impact stories')
  }

  return {
    stories: (data || []) as StoryWithContact[],
    total: count || 0,
  }
}

/**
 * Get a single impact story by ID
 */
export async function getStoryById(storyId: string): Promise<StoryWithContact | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('impact_stories')
    .select(
      `
      *,
      contact:contacts(first_name, last_name, email)
    `
    )
    .eq('id', storyId)
    .single()

  if (error) {
    console.error('Error fetching impact story:', error)
    return null
  }

  return data as StoryWithContact
}
