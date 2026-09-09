'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { getProgramMetrics } from '../queries/get-program-metrics'
import { calculateImpact, formatImpactForDisplay } from '../services/impact-calculator'
import { impactNarrativeSchema } from '../schemas/impact.schema'
import { randomBytes } from 'crypto'

export type GenerateImpactStoryResult =
  | { success: true; id: string; shareToken: string }
  | { success: false; error: string }

interface GenerateImpactStoryInput {
  contactId: string
  timePeriod?: string
  includeShareToken?: boolean
}

/**
 * Server action to generate an impact story for a contact
 *
 * Steps:
 * 1. Fetch contact's giving history for the time period
 * 2. Fetch organization's program metrics
 * 3. Calculate impact breakdown using the impact calculator
 * 4. Generate AI narrative and headline using Claude
 * 5. Save the impact story to the database
 * 6. Optionally generate a share token for public viewing
 */
export async function generateImpactStory(
  input: GenerateImpactStoryInput
): Promise<GenerateImpactStoryResult> {
  try {
    const { contactId, timePeriod = 'all-time', includeShareToken = false } = input

    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization and get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    const donorName = `${contact.first_name} ${contact.last_name}`.trim()

    // Calculate total giving for the time period
    let giftsQuery = supabase
      .from('gifts')
      .select('amount, gift_date')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)

    // Filter by time period if not "all-time"
    if (timePeriod !== 'all-time') {
      // Parse time period (e.g., "2024", "Q4 2024")
      const currentYear = new Date().getFullYear()
      let startDate: string

      if (timePeriod.match(/^\d{4}$/)) {
        // Year format: "2024"
        startDate = `${timePeriod}-01-01`
      } else {
        // For more complex periods, use current year by default
        startDate = `${currentYear}-01-01`
      }

      giftsQuery = giftsQuery.gte('gift_date', startDate)
    }

    const { data: gifts, error: giftsError } = await giftsQuery

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError)
      return { success: false, error: 'Failed to fetch giving history' }
    }

    const totalGiving = gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0

    if (totalGiving === 0) {
      return { success: false, error: 'No gifts found for this contact in the specified period' }
    }

    // Fetch program metrics for the organization
    const metrics = await getProgramMetrics(timePeriod !== 'all-time' ? timePeriod : undefined)

    if (metrics.length === 0) {
      return {
        success: false,
        error: 'No program metrics configured. Please add program metrics first.',
      }
    }

    // Calculate impact breakdown
    const impactBreakdown = calculateImpact(
      totalGiving,
      metrics.map((m) => ({
        program_name: m.program_name,
        metric_name: m.metric_name,
        cost_per_unit: m.cost_per_unit,
        icon: m.icon,
      }))
    )

    // Format impact for AI prompt
    const impactList = formatImpactForDisplay(impactBreakdown)

    if (impactList.length === 0) {
      return {
        success: false,
        error: 'Unable to calculate impact. The donation amount may be too small relative to program costs.',
      }
    }

    // Generate AI narrative using Claude
    const systemPrompt = `You are a nonprofit communications expert who writes warm, personal impact stories for donors.
Your goal is to make donors FEEL the impact of their giving through specific, emotional storytelling.
Use numbers to make the impact tangible, but focus on the human element and emotional connection.`

    const userPrompt = `Generate a warm, personal impact story for ${donorName}.

Their giving: $${totalGiving.toFixed(2)} over ${timePeriod}

Your programs delivered:
${impactList.map((item) => `- ${item}`).join('\n')}

Write a 2-3 sentence narrative that makes them FEEL the impact.
Use specific numbers. Make it emotional and shareable.
Also provide a short headline (under 8 words).

Return JSON: { "headline": "...", "narrative": "..." }`

    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      maxTokens: 512,
      model: MODELS.HAIKU, // Use Haiku for cost efficiency
      temperature: 0.8, // Higher temperature for more creative output
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', response.content)
      return { success: false, error: 'Failed to generate impact story narrative' }
    }

    let narrative
    try {
      narrative = impactNarrativeSchema.parse(JSON.parse(jsonMatch[0]))
    } catch (error) {
      console.error('Invalid narrative structure:', error)
      return { success: false, error: 'Failed to parse impact story narrative' }
    }

    // Generate share token if requested
    const shareToken = includeShareToken
      ? randomBytes(16).toString('hex')
      : null

    // Insert the impact story
    const { data: impactStory, error: insertError } = await supabase
      .from('impact_stories')
      .insert({
        contact_id: contactId,
        organization_id: organizationId,
        time_period: timePeriod,
        total_giving: totalGiving,
        headline: narrative.headline,
        narrative: narrative.narrative,
        impact_breakdown: impactBreakdown,
        share_token: shareToken,
      })
      .select('id')
      .single()

    if (insertError || !impactStory) {
      console.error('Error inserting impact story:', insertError)
      return { success: false, error: 'Failed to save impact story' }
    }

    // Track AI usage
    await trackUsage({
      organizationId,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'impact_story',
      contactId,
    })

    // Revalidate relevant paths
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath('/impact')
    revalidatePath('/')

    return {
      success: true,
      id: impactStory.id,
      shareToken: shareToken || '',
    }
  } catch (error) {
    console.error('Error generating impact story:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to delete an impact story
 */
export async function deleteImpactStory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Delete the impact story
    const { error: deleteError } = await supabase
      .from('impact_stories')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting impact story:', deleteError)
      return { success: false, error: 'Failed to delete impact story' }
    }

    // Revalidate relevant paths
    revalidatePath('/impact')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteImpactStory:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
