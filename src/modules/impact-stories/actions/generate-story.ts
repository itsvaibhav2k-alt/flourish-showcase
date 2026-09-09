/**
 * Generate Impact Story Action
 *
 * Server action to generate an AI-powered impact story for a donor
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { generateStorySchema } from '../schemas'
import { generateImpactStory } from '../services/generate-story'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { MODELS } from '@/lib/ai/claude'
import { revalidatePath } from 'next/cache'

export interface GenerateStoryResult {
  success: boolean
  storyId?: string
  title?: string
  content?: string
  shareUrl?: string
  error?: string
}

/**
 * Generate an impact story for a donor
 */
export async function generateStory(
  organizationId: string,
  data: unknown
): Promise<GenerateStoryResult> {
  try {
    // Validate input
    const parsed = generateStorySchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      }
    }

    const supabase = await createClient()

    // Verify user has access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return { success: false, error: 'Access denied to this organization' }
    }

    // Parse dates if provided
    const periodStart = parsed.data.period_start
      ? new Date(parsed.data.period_start)
      : undefined
    const periodEnd = parsed.data.period_end
      ? new Date(parsed.data.period_end)
      : undefined

    // Generate the story using AI
    const story = await generateImpactStory({
      organizationId,
      contactId: parsed.data.contact_id,
      periodStart,
      periodEnd,
    })

    // Track AI usage (approximate token counts based on content length)
    const estimatedInputTokens = 500 // System prompt + context
    const estimatedOutputTokens = Math.ceil(story.content.length / 4) // Rough approximation

    await trackUsage({
      organizationId,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      model: MODELS.HAIKU,
      emailType: 'custom', // Use custom type for impact stories
      contactId: parsed.data.contact_id,
    })

    // Save the story to database
    const { data: savedStory, error: saveError } = await supabase
      .from('impact_stories')
      .insert({
        organization_id: organizationId,
        contact_id: parsed.data.contact_id,
        title: story.title,
        story_content: story.content,
        metrics: story.metrics,
        total_giving: story.totalGiving,
        period_start: periodStart?.toISOString().split('T')[0] || null,
        period_end: periodEnd?.toISOString().split('T')[0] || null,
        is_public: true,
      })
      .select('id, share_token, title, story_content')
      .single()

    if (saveError || !savedStory) {
      console.error('Error saving impact story:', saveError)
      return { success: false, error: 'Failed to save impact story' }
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/impact/${savedStory.share_token}`

    // Revalidate paths
    revalidatePath(`/flora/impact-stories`)
    revalidatePath(`/contacts/${parsed.data.contact_id}`)

    return {
      success: true,
      storyId: savedStory.id,
      title: savedStory.title,
      content: savedStory.story_content,
      shareUrl,
    }
  } catch (error) {
    console.error('Generate story error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate story. Please try again.',
    }
  }
}
