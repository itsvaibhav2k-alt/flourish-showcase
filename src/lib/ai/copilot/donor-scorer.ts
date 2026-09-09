/**
 * AI Fundraising Copilot - Donor Scorer
 *
 * Scores donors on giving likelihood and predicts optimal engagement strategy.
 * Uses both algorithmic scoring and AI-powered analysis.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { buildDonorContext, DonorContext } from '@/lib/ai/context/builder'

export interface DonorScore {
  // Overall score (0-100)
  score: number
  scoreReasoning: string

  // Predictions
  predictedGiftAmount: number | null
  predictedSuccessRate: number // 0-100
  optimalTiming: string // e.g., "This week", "Before year-end", etc.
  preferredChannel: 'email' | 'phone' | 'mail' | 'in_person'

  // Engagement factors
  engagementFactors: {
    givingHistory: number // 0-25 points
    recency: number // 0-25 points
    frequency: number // 0-25 points
    trend: number // 0-25 points
  }

  // Risk indicators
  lapseRisk: 'low' | 'medium' | 'high'
  daysUntilLapse: number | null
}

/**
 * Calculate comprehensive donor score with AI-powered predictions
 */
export async function calculateDonorScore(
  contactId: string
): Promise<DonorScore> {
  // Build donor context
  const context = await buildDonorContext(contactId)

  // Calculate algorithmic score components
  const engagementFactors = calculateEngagementFactors(context)

  // Calculate overall algorithmic score (0-100)
  const algorithmicScore =
    engagementFactors.givingHistory +
    engagementFactors.recency +
    engagementFactors.frequency +
    engagementFactors.trend

  // Calculate lapse risk
  const { lapseRisk, daysUntilLapse } = calculateLapseRisk(context)

  // Use AI to enhance predictions and provide reasoning
  const aiPredictions = await generateAIPredictions(context, algorithmicScore)

  return {
    score: Math.round(algorithmicScore),
    scoreReasoning: aiPredictions.reasoning,
    predictedGiftAmount: aiPredictions.predictedAmount,
    predictedSuccessRate: aiPredictions.successRate,
    optimalTiming: aiPredictions.timing,
    preferredChannel: aiPredictions.channel,
    engagementFactors,
    lapseRisk,
    daysUntilLapse,
  }
}

/**
 * Calculate engagement factor scores (100 points total)
 */
function calculateEngagementFactors(context: DonorContext): {
  givingHistory: number
  recency: number
  frequency: number
  trend: number
} {
  // GIVING HISTORY (0-25 points)
  // Based on lifetime giving and donor segment
  let givingHistory = 0
  if (context.giving.lifetimeGiving >= 10000) givingHistory = 25 // Major donor
  else if (context.giving.lifetimeGiving >= 5000) givingHistory = 22 // Leadership
  else if (context.giving.lifetimeGiving >= 1000) givingHistory = 18 // Sustaining
  else if (context.giving.lifetimeGiving >= 500) givingHistory = 14 // Regular
  else if (context.giving.lifetimeGiving >= 100) givingHistory = 10 // Emerging
  else givingHistory = 5 // New/small

  // RECENCY (0-25 points)
  // How recently they gave
  let recency = 0
  if (context.giving.lastGiftDate) {
    const daysSinceLastGift = Math.floor(
      (Date.now() - new Date(context.giving.lastGiftDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastGift <= 30) recency = 25 // Last 30 days
    else if (daysSinceLastGift <= 90) recency = 22 // Last quarter
    else if (daysSinceLastGift <= 180) recency = 18 // Last 6 months
    else if (daysSinceLastGift <= 365) recency = 14 // Last year
    else if (daysSinceLastGift <= 730) recency = 8 // Last 2 years
    else recency = 3 // Over 2 years
  }

  // FREQUENCY (0-25 points)
  // How often they give
  let frequency = 0
  const giftsPerYear = context.relationship.yearsOfSupport > 0
    ? context.giving.totalGifts / context.relationship.yearsOfSupport
    : context.giving.totalGifts

  if (giftsPerYear >= 12) frequency = 25 // Monthly+
  else if (giftsPerYear >= 4) frequency = 22 // Quarterly
  else if (giftsPerYear >= 2) frequency = 18 // Bi-annual
  else if (giftsPerYear >= 1) frequency = 14 // Annual
  else if (context.giving.totalGifts >= 2) frequency = 10 // Occasional
  else frequency = 5 // One-time

  // TREND (0-25 points)
  // Are gifts increasing, stable, or decreasing?
  let trend = 0
  if (context.giving.recentGifts.length >= 3) {
    const recent3 = context.giving.recentGifts.slice(0, 3)
    const avgRecent = recent3.reduce((sum, g) => sum + g.amount, 0) / 3

    const older3 = context.giving.recentGifts.slice(3, 6)
    if (older3.length >= 2) {
      const avgOlder = older3.reduce((sum, g) => sum + g.amount, 0) / older3.length

      const percentChange = ((avgRecent - avgOlder) / avgOlder) * 100

      if (percentChange >= 50) trend = 25 // Strong increase
      else if (percentChange >= 20) trend = 22 // Moderate increase
      else if (percentChange >= -10) trend = 18 // Stable
      else if (percentChange >= -30) trend = 12 // Slight decline
      else trend = 6 // Declining
    } else {
      // Not enough history, base on recent activity
      trend = 15 // Neutral
    }
  } else if (context.giving.totalGifts >= 2) {
    // Compare last gift to average
    const lastGift = context.giving.lastGiftAmount || 0
    const avgGift = context.giving.avgGift

    if (lastGift >= avgGift * 1.5) trend = 22 // Increased
    else if (lastGift >= avgGift * 0.8) trend = 18 // Stable
    else trend = 12 // Decreased
  } else {
    trend = 15 // New donor, neutral
  }

  return {
    givingHistory: Math.round(givingHistory),
    recency: Math.round(recency),
    frequency: Math.round(frequency),
    trend: Math.round(trend),
  }
}

/**
 * Calculate lapse risk based on giving patterns
 */
function calculateLapseRisk(context: DonorContext): {
  lapseRisk: 'low' | 'medium' | 'high'
  daysUntilLapse: number | null
} {
  if (!context.giving.lastGiftDate || context.giving.totalGifts < 2) {
    return { lapseRisk: 'medium', daysUntilLapse: null }
  }

  const daysSinceLastGift = Math.floor(
    (Date.now() - new Date(context.giving.lastGiftDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Calculate expected giving frequency
  const yearsActive = context.relationship.yearsOfSupport || 1
  const avgDaysBetweenGifts = (yearsActive * 365) / context.giving.totalGifts

  // Calculate when they're "due" for next gift
  const expectedDaysUntilNext = avgDaysBetweenGifts - daysSinceLastGift
  const daysUntilLapse = expectedDaysUntilNext > 0 ? Math.round(expectedDaysUntilNext) : null

  // Determine risk level
  let lapseRisk: 'low' | 'medium' | 'high'

  if (daysSinceLastGift > avgDaysBetweenGifts * 2) {
    lapseRisk = 'high' // Well past expected giving cycle
  } else if (daysSinceLastGift > avgDaysBetweenGifts * 1.5) {
    lapseRisk = 'medium' // Approaching lapse
  } else {
    lapseRisk = 'low' // Within normal cycle
  }

  return { lapseRisk, daysUntilLapse }
}

/**
 * Use AI to generate predictions and reasoning
 */
async function generateAIPredictions(
  context: DonorContext,
  algorithmicScore: number
): Promise<{
  reasoning: string
  predictedAmount: number | null
  successRate: number
  timing: string
  channel: 'email' | 'phone' | 'mail' | 'in_person'
}> {
  const systemPrompt = `You are an expert fundraising analyst with deep knowledge of donor behavior and giving patterns. You analyze donor data to predict optimal engagement strategies.

Your task is to provide strategic fundraising insights and predictions based on donor data.

IMPORTANT: You must respond ONLY with valid JSON. No markdown, no explanations outside the JSON structure.`

  const userPrompt = `Analyze this donor and provide strategic fundraising predictions:

DONOR: ${context.donor.fullName}

GIVING HISTORY:
- Lifetime Giving: $${context.giving.lifetimeGiving.toFixed(2)}
- Total Gifts: ${context.giving.totalGifts}
- Average Gift: $${context.giving.avgGift.toFixed(2)}
- Last Gift: ${context.giving.lastGiftAmount ? `$${context.giving.lastGiftAmount.toFixed(2)}` : 'N/A'} on ${context.giving.lastGiftDate || 'N/A'}
- Recent Gifts: ${context.giving.recentGifts.map(g => `$${g.amount.toFixed(2)} on ${g.date}`).join(', ') || 'None'}

RELATIONSHIP:
- Segment: ${context.relationship.segment}
- Engagement Score: ${context.relationship.engagementScore}/100
- Years of Support: ${context.relationship.yearsOfSupport}
- Tags: ${context.relationship.tags.join(', ') || 'None'}

ALGORITHMIC SCORE: ${algorithmicScore}/100

Based on this data, provide predictions in this exact JSON format:
{
  "reasoning": "2-3 sentence explanation of why this donor has this score and what it means for engagement strategy",
  "predictedAmount": <number or null>,
  "successRate": <0-100>,
  "timing": "<one of: 'This week', 'Within 2 weeks', 'This month', 'This quarter', 'Before year-end', 'After holidays', 'Not recommended'>",
  "channel": "<one of: 'email', 'phone', 'mail', 'in_person'>"
}

Guidelines:
- predictedAmount should be based on their giving history and trends (null if insufficient data)
- successRate is the likelihood (0-100) they'll respond positively to outreach now
- timing should consider their giving patterns, time of year, and lapse risk
- channel should match their segment and giving level (major donors prefer personal touch)`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU, // Fast and cost-effective
      maxTokens: 512,
      temperature: 0.3, // Lower temperature for more consistent predictions
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const predictions = JSON.parse(jsonMatch[0])

    // Validate and return
    return {
      reasoning: predictions.reasoning || 'No specific insights available.',
      predictedAmount: typeof predictions.predictedAmount === 'number'
        ? predictions.predictedAmount
        : null,
      successRate: Math.min(100, Math.max(0, predictions.successRate || 50)),
      timing: predictions.timing || 'This month',
      channel: ['email', 'phone', 'mail', 'in_person'].includes(predictions.channel)
        ? predictions.channel
        : 'email',
    }
  } catch (error) {
    console.error('Error generating AI predictions:', error)

    // Fallback predictions based on algorithmic score
    return {
      reasoning: `Donor score of ${algorithmicScore}/100 based on giving history, recency, frequency, and trend analysis.`,
      predictedAmount: context.giving.avgGift > 0 ? context.giving.avgGift : null,
      successRate: algorithmicScore,
      timing: algorithmicScore >= 70 ? 'This week' : 'This month',
      channel: context.relationship.segment === 'Major Donor' ? 'phone' : 'email',
    }
  }
}

/**
 * Batch score multiple donors (for optimization)
 */
export async function batchCalculateDonorScores(
  contactIds: string[]
): Promise<Map<string, DonorScore>> {
  const scores = new Map<string, DonorScore>()

  // Process in parallel with rate limiting (max 5 concurrent)
  const batchSize = 5
  for (let i = 0; i < contactIds.length; i += batchSize) {
    const batch = contactIds.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(id => calculateDonorScore(id))
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        scores.set(batch[index], result.value)
      } else {
        console.error(`Failed to score donor ${batch[index]}:`, result.reason)
      }
    })
  }

  return scores
}
