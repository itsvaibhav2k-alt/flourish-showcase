/**
 * Organization Pulse Tile Generator
 *
 * Generates a comprehensive health score and pulse check for the organization,
 * including key metrics, alerts, and opportunities.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { buildTileContext, serializeTileContext } from '../context-builder'
import { getCachedTileData, setCachedTileData } from '../cache'

export interface OrgPulseInsight {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs-attention'
  healthScore: number // 0-100
  summary: string
  metrics: Array<{
    name: string
    value: string
    trend: 'up' | 'down' | 'stable'
    insight: string
  }>
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
  }>
  opportunities: string[]
}

/**
 * Generate organization pulse insights using Claude AI
 */
export async function generateOrgPulseInsights(
  organizationId: string
): Promise<OrgPulseInsight> {
  // Check cache first
  const cached = await getCachedTileData<OrgPulseInsight>(
    organizationId,
    'org-pulse'
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

  const systemPrompt = `You are an expert nonprofit consultant providing a comprehensive organizational health assessment.

Your task is to analyze all organizational metrics and provide an overall health score, key metrics, alerts, and growth opportunities.

Consider:
1. Donor health and retention
2. Volunteer engagement
3. Recent activity trends
4. Financial sustainability indicators
5. Growth opportunities

Return your analysis as a JSON object with this exact structure:
{
  "overallHealth": "excellent|good|fair|needs-attention",
  "healthScore": 75 (0-100, your calculated score),
  "summary": "2-3 sentence executive summary of organization health",
  "metrics": [
    {
      "name": "Metric Name",
      "value": "Formatted value with units",
      "trend": "up|down|stable",
      "insight": "Brief explanation of what this means"
    }
  ],
  "alerts": [
    {
      "type": "warning|info|success",
      "message": "Alert message"
    }
  ],
  "opportunities": [
    "Growth opportunity 1",
    "Growth opportunity 2",
    "Growth opportunity 3"
  ]
}

HEALTH SCORE CALCULATION:
- 90-100: Excellent (strong donor retention, good growth, high engagement)
- 70-89: Good (healthy metrics, minor areas for improvement)
- 50-69: Fair (some concerning trends, action needed)
- 0-49: Needs Attention (significant issues requiring immediate action)

CRITICAL RULES:
- Include 4-6 key metrics (donor retention, giving trends, volunteer engagement, etc.)
- Limit to 3-5 most important alerts
- Focus on actionable opportunities
- Be honest about areas needing attention
- Return ONLY valid JSON, no additional text`

  const userPrompt = `${contextStr}

Provide a comprehensive organization health assessment. Calculate an overall health score and identify key metrics, alerts, and opportunities.`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU,
      maxTokens: 2048,
      temperature: 0.3, // Lower temperature for consistent analysis
    })

    // Track usage
    await trackUsage({
      organizationId,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'tile_org_pulse',
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const insights = JSON.parse(jsonMatch[0]) as OrgPulseInsight

    // Validate structure
    if (!insights.overallHealth || !insights.summary || !insights.metrics) {
      throw new Error('Invalid insights structure')
    }

    // Ensure health score is in range
    insights.healthScore = Math.min(100, Math.max(0, insights.healthScore))

    // Cache the results
    await setCachedTileData(organizationId, 'org-pulse', insights, undefined, 24)

    return insights
  } catch (error) {
    console.error('Error generating org pulse insights:', error)

    // Return fallback insights
    return generateFallbackOrgPulse(context)
  }
}

/**
 * Generate fallback org pulse when AI fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackOrgPulse(context: any): OrgPulseInsight {
  const metrics: OrgPulseInsight['metrics'] = []
  const alerts: OrgPulseInsight['alerts'] = []
  let healthScore = 70 // Default to "good"

  // Donor metrics
  if (context.donorSummary) {
    const { totalDonors, atRiskDonors, totalRaisedThisYear, activeDonors } =
      context.donorSummary

    metrics.push({
      name: 'Total Donors',
      value: totalDonors.toString(),
      trend: 'stable',
      insight: `You have ${totalDonors} donors in your database`,
    })

    metrics.push({
      name: 'Raised This Year',
      value: `$${totalRaisedThisYear.toLocaleString()}`,
      trend: 'stable',
      insight: 'Year-to-date fundraising performance',
    })

    // Calculate donor health impact on score
    const atRiskPercent = totalDonors > 0 ? (atRiskDonors / totalDonors) * 100 : 0
    if (atRiskPercent > 30) {
      healthScore -= 20
      alerts.push({
        type: 'warning',
        message: `${atRiskDonors} donors are at risk of lapsing - take action this week`,
      })
    } else if (atRiskPercent > 15) {
      healthScore -= 10
      alerts.push({
        type: 'info',
        message: `${atRiskDonors} donors need attention to prevent lapse`,
      })
    }

    const activePercent = totalDonors > 0 ? (activeDonors / totalDonors) * 100 : 0
    if (activePercent > 60) {
      healthScore += 10
      alerts.push({
        type: 'success',
        message: `${activePercent.toFixed(0)}% of donors are active - excellent retention!`,
      })
    }
  }

  // Volunteer metrics
  if (context.volunteerSummary) {
    const { totalVolunteers, hoursThisMonth } = context.volunteerSummary

    metrics.push({
      name: 'Volunteer Hours',
      value: `${hoursThisMonth} hrs`,
      trend: 'stable',
      insight: 'Hours logged this month',
    })

    if (totalVolunteers > 0) {
      metrics.push({
        name: 'Total Volunteers',
        value: totalVolunteers.toString(),
        trend: 'stable',
        insight: 'Active volunteers in your program',
      })
    }
  }

  // Recent activity
  if (context.recentActivity) {
    const { newDonors, newGifts } = context.recentActivity

    if (newDonors > 0) {
      alerts.push({
        type: 'success',
        message: `${newDonors} new donors this month - great acquisition!`,
      })
      healthScore += 5
    }

    if (newGifts > 0) {
      metrics.push({
        name: 'Gifts This Month',
        value: newGifts.toString(),
        trend: 'up',
        insight: `${newGifts} gifts received this month`,
      })
    }
  }

  // Determine overall health
  let overallHealth: OrgPulseInsight['overallHealth'] = 'good'
  if (healthScore >= 90) overallHealth = 'excellent'
  else if (healthScore >= 70) overallHealth = 'good'
  else if (healthScore >= 50) overallHealth = 'fair'
  else overallHealth = 'needs-attention'

  return {
    overallHealth,
    healthScore: Math.min(100, Math.max(0, healthScore)),
    summary: `Your organization is in ${overallHealth} health overall. ${
      alerts.length > 0
        ? 'There are some areas that need attention.'
        : 'Continue with current strategies.'
    }`,
    metrics,
    alerts,
    opportunities: [
      'Implement re-engagement campaign for at-risk donors',
      'Expand volunteer recruitment for upcoming events',
      'Create monthly giving program to increase recurring revenue',
    ],
  }
}
