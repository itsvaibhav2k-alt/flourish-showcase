/**
 * Get Impact Story by Token Query
 *
 * Fetches a public impact story using share token (no auth required)
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface PublicStory {
  id: string
  title: string
  story_content: string
  metrics: Record<string, number>
  total_giving: number
  period_start: string | null
  period_end: string | null
  created_at: string
  contact: {
    first_name: string
  }
  organization: {
    name: string
    logo_url: string | null
  }
  impact_metrics: Array<{
    metric_name: string
    unit_label: string
    unit_label_plural: string | null
    icon: string | null
  }>
}

/**
 * Get a public impact story by share token
 * No authentication required - used for public share links
 */
export async function getStoryByToken(token: string): Promise<PublicStory | null> {
  // Use admin client to bypass RLS for public access
  const supabase = createAdminClient()

  const { data: story, error } = await supabase
    .from('impact_stories')
    .select(
      `
      id,
      title,
      story_content,
      metrics,
      total_giving,
      period_start,
      period_end,
      created_at,
      is_public,
      contact:contacts!inner(first_name),
      organization:organizations!inner(name, logo_url)
    `
    )
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !story) {
    console.error('Error fetching public impact story:', error)
    return null
  }

  // Get the organization's impact metrics to display labels
  const { data: metrics } = await supabase
    .from('impact_metrics')
    .select('metric_name, unit_label, unit_label_plural, icon')
    .eq('organization_id', (story.organization as any).id)
    .eq('is_active', true)

  return {
    ...story,
    impact_metrics: metrics || [],
  } as PublicStory
}

/**
 * Increment the view count for a story (public)
 */
export async function incrementStoryViewCount(token: string): Promise<void> {
  const supabase = createAdminClient()

  // Call the SQL function to increment view count
  const { error } = await supabase.rpc('increment_story_view_count', {
    story_token: token,
  })

  if (error) {
    console.error('Error incrementing story view count:', error)
  }
}
