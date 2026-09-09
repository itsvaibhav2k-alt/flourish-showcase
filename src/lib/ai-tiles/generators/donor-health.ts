/**
 * Donor Health Tile Generator
 *
 * Generates AI-powered insights about donor health, including at-risk donors,
 * giving trends, and actionable recommendations.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { buildTileContext, serializeTileContext } from '../context-builder'
import { getCachedTileData, setCachedTileData } from '../cache'

export interface DonorHealthInsight {
  summary: string
  atRiskDonors: Array<{
    id: string
    name: string
    riskLevel: 'high' | 'medium' | 'low'
    reason: string
    suggestedAction: string
    optimalAskAmount?: number
  }>
  givingTrends: {
    direction: 'up' | 'down' | 'stable'
    percentChange: number
    insight: string
  }
  recommendations: string[]
}

/**
 * Generate donor health insights using Claude AI
 */
export async function generateDonorHealthInsights(
  organizationId: string
): Promise<DonorHealthInsight> {
  // Check cache first
  const cached = await getCachedTileData<DonorHealthInsight>(
    organizationId,
    'donor-health'
  )

  if (cached) {
    return cached
  }

  // Build context with donor data
  const context = await buildTileContext(organizationId, ['donors', 'activity'])
  const contextStr = serializeTileContext(context)

  const systemPrompt = `You are an expert nonprofit fundraising analyst specializing in donor retention and health.

Your task is to analyze donor metrics and identify key insights about the health of the donor base.

Focus on:
1. At-risk donors who need immediate attention
2. Overall giving trends (up, down, or stable)
3. Actionable recommendations to improve donor retention

Return your analysis as a JSON object with this exact structure:
{
  "summary": "2-3 sentence executive summary of overall donor health",
  "atRiskDonors": [
    {
      "id": "donor_contact_id (or 'unknown' if not available)",
      "name": "Donor Name",
      "riskLevel": "high|medium|low",
      "reason": "Why they're at risk",
      "suggestedAction": "Specific action to take",
      "optimalAskAmount": 100 (optional, number only)
    }
  ],
  "givingTrends": {
    "direction": "up|down|stable",
    "percentChange": 0,
    "insight": "Explanation of the trend"
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

CRITICAL RULES:
- Be specific and actionable
- Focus on the most important 3-5 at-risk donors
- Keep recommendations practical and achievable
- Use actual data from the context
- Return ONLY valid JSON, no additional text`

  const userPrompt = `${contextStr}

Analyze this donor data and provide insights on donor health. Focus on identifying at-risk donors and overall giving trends.

Important: Base your analysis ONLY on the data provided above. If certain data is missing, work with what you have.`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU, // Cost-efficient for analytics
      maxTokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    // Track usage
    await trackUsage({
      organizationId,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'tile_donor_health',
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const insights = JSON.parse(jsonMatch[0]) as DonorHealthInsight

    // Validate structure
    if (!insights.summary || !insights.givingTrends || !insights.recommendations) {
      throw new Error('Invalid insights structure')
    }

    // Cache the results
    await setCachedTileData(organizationId, 'donor-health', insights, undefined, 24)

    return insights
  } catch (error) {
    console.error('Error generating donor health insights:', error)

    // Return fallback insights
    return generateFallbackDonorHealth(context.donorSummary)
  }
}

/**
 * Generate fallback insights when AI fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackDonorHealth(donorSummary: any): DonorHealthInsight {
  const atRiskCount = donorSummary?.atRiskDonors || 0
  const lapsedCount = donorSummary?.lapsedDonors || 0
  const totalDonors = donorSummary?.totalDonors || 0

  let direction: 'up' | 'down' | 'stable' = 'stable'
  let percentChange = 0

  // Simple trend analysis based on at-risk percentage
  const atRiskPercent = totalDonors > 0 ? (atRiskCount / totalDonors) * 100 : 0

  if (atRiskPercent > 30) {
    direction = 'down'
    percentChange = -atRiskPercent
  } else if (atRiskPercent < 10) {
    direction = 'up'
    percentChange = 10
  }

  return {
    summary: `Your donor base has ${totalDonors} donors with ${atRiskCount} at risk and ${lapsedCount} lapsed. ${
      atRiskCount > 0
        ? 'Immediate attention needed for at-risk donors.'
        : 'Overall health is stable.'
    }`,
    atRiskDonors: [],
    givingTrends: {
      direction,
      percentChange,
      insight: `Based on current metrics, ${atRiskCount} donors need attention to prevent lapse.`,
    },
    recommendations: [
      'Review and contact at-risk donors within the next week',
      'Send personalized re-engagement emails to lapsed donors',
      'Create a stewardship plan for your most loyal donors',
    ],
  }
}
