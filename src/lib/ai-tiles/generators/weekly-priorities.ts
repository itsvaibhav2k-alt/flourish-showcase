/**
 * Weekly Priorities Tile Generator
 *
 * Generates AI-powered weekly action priorities for nonprofit staff.
 * Identifies high-priority contacts and quick wins.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { buildTileContext, serializeTileContext } from '../context-builder'
import { getCachedTileData, setCachedTileData } from '../cache'

export interface WeeklyPrioritiesInsight {
  summary: string
  priorityContacts: Array<{
    id: string
    name: string
    type: 'donor' | 'volunteer' | 'prospect'
    priority: 'urgent' | 'high' | 'medium'
    reason: string
    suggestedAction: string
    successProbability: number // 0-100
  }>
  quickWins: string[]
  focusAreas: string[]
}

/**
 * Generate weekly priorities insights using Claude AI
 */
export async function generateWeeklyPrioritiesInsights(
  organizationId: string
): Promise<WeeklyPrioritiesInsight> {
  // Check cache first (shorter cache for priorities - 12 hours)
  const cached = await getCachedTileData<WeeklyPrioritiesInsight>(
    organizationId,
    'weekly-priorities'
  )

  if (cached) {
    return cached
  }

  // Build comprehensive context
  const context = await buildTileContext(organizationId, [
    'donors',
    'volunteers',
    'activity',
  ])
  const contextStr = serializeTileContext(context)

  const systemPrompt = `You are an expert nonprofit strategist helping staff prioritize their weekly actions for maximum impact.

Your task is to analyze organizational data and recommend the top priority contacts to engage this week, along with quick wins and focus areas.

Consider:
1. Donors at risk of lapsing (urgent priority)
2. Major donors ready for asks (high priority)
3. Recent givers needing stewardship (high priority)
4. Volunteers with upcoming shifts (medium priority)
5. Opportunities for quick engagement wins

Return your analysis as a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of this week's priorities",
  "priorityContacts": [
    {
      "id": "contact_id (or 'unknown' if not available)",
      "name": "Contact Name",
      "type": "donor|volunteer|prospect",
      "priority": "urgent|high|medium",
      "reason": "Why they're a priority this week",
      "suggestedAction": "Specific action to take",
      "successProbability": 75 (0-100, your estimate of success)
    }
  ],
  "quickWins": [
    "Quick action item 1",
    "Quick action item 2",
    "Quick action item 3"
  ],
  "focusAreas": [
    "Strategic focus area 1",
    "Strategic focus area 2"
  ]
}

CRITICAL RULES:
- Limit to 5-7 priority contacts (most important only)
- Order by priority (urgent first, then high, then medium)
- Make suggested actions specific and time-bound (this week)
- Quick wins should be achievable within 1-2 hours
- Focus areas should be strategic themes for the week
- Return ONLY valid JSON, no additional text`

  const userPrompt = `${contextStr}

Analyze this data and recommend this week's top priorities. Focus on the most impactful actions staff can take this week.

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU,
      maxTokens: 2048,
      temperature: 0.4, // Slightly higher for varied suggestions
    })

    // Track usage
    await trackUsage({
      organizationId,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'tile_weekly_priorities',
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const insights = JSON.parse(jsonMatch[0]) as WeeklyPrioritiesInsight

    // Validate structure
    if (!insights.summary || !insights.priorityContacts || !insights.quickWins) {
      throw new Error('Invalid insights structure')
    }

    // Ensure success probabilities are in range
    insights.priorityContacts = insights.priorityContacts.map(contact => ({
      ...contact,
      successProbability: Math.min(100, Math.max(0, contact.successProbability)),
    }))

    // Cache the results (12 hours for priorities)
    await setCachedTileData(organizationId, 'weekly-priorities', insights, undefined, 12)

    return insights
  } catch (error) {
    console.error('Error generating weekly priorities:', error)

    // Return fallback priorities
    return generateFallbackPriorities(context)
  }
}

/**
 * Generate fallback priorities when AI fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackPriorities(context: any): WeeklyPrioritiesInsight {
  const priorityContacts: WeeklyPrioritiesInsight['priorityContacts'] = []

  // Add at-risk donors as priorities
  if (context.donorSummary?.atRiskDonors > 0) {
    priorityContacts.push({
      id: 'unknown',
      name: 'At-Risk Donors',
      type: 'donor',
      priority: 'urgent',
      reason: `${context.donorSummary.atRiskDonors} donors at risk of lapsing`,
      suggestedAction: 'Review and contact at-risk donors this week',
      successProbability: 70,
    })
  }

  // Add recent gifts requiring stewardship
  if (context.recentActivity?.newGifts > 0) {
    priorityContacts.push({
      id: 'unknown',
      name: 'Recent Donors',
      type: 'donor',
      priority: 'high',
      reason: `${context.recentActivity.newGifts} new gifts this month need thank you`,
      suggestedAction: 'Send personalized thank-you messages',
      successProbability: 95,
    })
  }

  return {
    summary: `This week, focus on ${priorityContacts.length} priority areas including donor retention and stewardship.`,
    priorityContacts,
    quickWins: [
      'Send 3 personalized donor thank-you emails',
      'Call your top donor to check in',
      'Review and update contact tags for better segmentation',
    ],
    focusAreas: [
      'Donor Retention - Contact at-risk donors',
      'Stewardship - Thank recent givers',
    ],
  }
}
