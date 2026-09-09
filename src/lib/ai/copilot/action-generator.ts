/**
 * AI Fundraising Copilot - Action Generator
 *
 * Analyzes donors and generates personalized fundraising action recommendations.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { buildDonorContext, DonorContext } from '@/lib/ai/context/builder'
import { calculateDonorScore, DonorScore } from './donor-scorer'
import {
  getCopilotSystemPrompt,
  getCopilotUserPrompt,
} from './prompts'

export type CopilotActionType = 'reach_out' | 'send_ask' | 're_engage' | 'thank' | 'follow_up'

export interface CopilotAction {
  // Action details
  actionType: CopilotActionType
  priority: number // 1-100

  // Content
  title: string
  description: string
  reasoning: string

  // Predictions
  predictedGiftAmount: number | null
  predictedSuccessRate: number
  optimalTiming: string
  preferredChannel: 'email' | 'phone' | 'mail' | 'in_person'

  // Donor score (for reference)
  donorScore: number
  donorScoreReasoning: string

  // Context snapshot
  contextSnapshot: {
    lifetimeGiving: number
    totalGifts: number
    lastGiftDate: string | null
    lastGiftAmount: number | null
    lapseRisk: string
    segment: string
  }
}

/**
 * Generate a personalized copilot action for a donor
 */
export async function generateCopilotAction(
  contactId: string
): Promise<CopilotAction> {
  // Step 1: Build donor context
  const context = await buildDonorContext(contactId)

  // Step 2: Calculate donor score
  const score = await calculateDonorScore(contactId)

  // Step 3: Use AI to generate action recommendation
  const action = await generateActionWithAI(context, score)

  return {
    ...action,
    donorScore: score.score,
    donorScoreReasoning: score.scoreReasoning,
    contextSnapshot: {
      lifetimeGiving: context.giving.lifetimeGiving,
      totalGifts: context.giving.totalGifts,
      lastGiftDate: context.giving.lastGiftDate,
      lastGiftAmount: context.giving.lastGiftAmount,
      lapseRisk: score.lapseRisk,
      segment: context.relationship.segment,
    },
  }
}

/**
 * Generate action recommendation using Claude AI
 */
async function generateActionWithAI(
  context: DonorContext,
  score: DonorScore
): Promise<Omit<CopilotAction, 'donorScore' | 'donorScoreReasoning' | 'contextSnapshot'>> {
  const systemPrompt = getCopilotSystemPrompt()
  const userPrompt = getCopilotUserPrompt(context, score)

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU, // Fast and cost-effective
      maxTokens: 1024,
      temperature: 0.5, // Moderate creativity for varied suggestions
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const aiAction = JSON.parse(jsonMatch[0])

    // Validate and construct action
    return {
      actionType: validateActionType(aiAction.actionType),
      priority: Math.min(100, Math.max(1, aiAction.priority || 50)),
      title: aiAction.title || 'Follow up with donor',
      description: aiAction.description || 'Reach out to maintain relationship',
      reasoning: aiAction.reasoning || 'Continue engagement with this donor.',
      predictedGiftAmount: typeof aiAction.predictedGiftAmount === 'number'
        ? aiAction.predictedGiftAmount
        : null,
      predictedSuccessRate: Math.min(100, Math.max(0, aiAction.predictedSuccessRate || 50)),
      optimalTiming: aiAction.optimalTiming || 'This month',
      preferredChannel: validateChannel(aiAction.preferredChannel),
    }
  } catch (error) {
    console.error('Error generating action with AI:', error)

    // Fallback to rule-based action generation
    return generateFallbackAction(context, score)
  }
}

/**
 * Fallback action generation when AI fails
 */
function generateFallbackAction(
  context: DonorContext,
  score: DonorScore
): Omit<CopilotAction, 'donorScore' | 'donorScoreReasoning' | 'contextSnapshot'> {
  // High lapse risk - re-engage
  if (score.lapseRisk === 'high') {
    return {
      actionType: 're_engage',
      priority: 90,
      title: `Re-engage ${context.donor.firstName} before they lapse`,
      description: `Reach out to reconnect with this donor who hasn't given in ${score.daysUntilLapse !== null ? Math.abs(score.daysUntilLapse) : 'many'} days.`,
      reasoning: 'This donor is at high risk of lapsing based on their giving patterns. Re-engagement is critical to prevent attrition.',
      predictedGiftAmount: context.giving.avgGift > 0 ? context.giving.avgGift : null,
      predictedSuccessRate: 60,
      optimalTiming: 'This week',
      preferredChannel: context.relationship.segment === 'Major Donor' ? 'phone' : 'email',
    }
  }

  // Recent gift - thank
  if (context.giving.lastGiftDate) {
    const daysSinceGift = Math.floor(
      (Date.now() - new Date(context.giving.lastGiftDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysSinceGift <= 30) {
      return {
        actionType: 'thank',
        priority: 75,
        title: `Send impact update to ${context.donor.firstName}`,
        description: `Thank them for their recent $${context.giving.lastGiftAmount?.toFixed(2)} gift and share specific impact.`,
        reasoning: 'Recent gift requires timely stewardship to strengthen the relationship and encourage continued support.',
        predictedGiftAmount: null,
        predictedSuccessRate: 95,
        optimalTiming: 'This week',
        preferredChannel: 'email',
      }
    }
  }

  // High score - send ask
  if (score.score >= 70) {
    const askAmount = context.giving.avgGift * 1.2 // Suggest 20% increase
    return {
      actionType: 'send_ask',
      priority: 80,
      title: `Request $${askAmount.toFixed(0)} gift from ${context.donor.firstName}`,
      description: `Based on their giving history and timing, make a personalized ask for $${askAmount.toFixed(0)}.`,
      reasoning: 'High donor score and favorable timing make this an optimal moment for a gift solicitation.',
      predictedGiftAmount: askAmount,
      predictedSuccessRate: score.score,
      optimalTiming: score.optimalTiming,
      preferredChannel: score.preferredChannel,
    }
  }

  // Default - reach out
  return {
    actionType: 'reach_out',
    priority: 60,
    title: `Maintain relationship with ${context.donor.firstName}`,
    description: 'General relationship-building contact to stay connected and learn about their interests.',
    reasoning: 'Continue cultivation through regular, meaningful touchpoints that build relationship depth.',
    predictedGiftAmount: null,
    predictedSuccessRate: 70,
    optimalTiming: 'This month',
    preferredChannel: 'email',
  }
}

/**
 * Validate action type
 */
function validateActionType(type: string): CopilotActionType {
  const validTypes: CopilotActionType[] = ['reach_out', 'send_ask', 're_engage', 'thank', 'follow_up']
  return validTypes.includes(type as CopilotActionType)
    ? (type as CopilotActionType)
    : 'reach_out'
}

/**
 * Validate communication channel
 */
function validateChannel(channel: string): 'email' | 'phone' | 'mail' | 'in_person' {
  const validChannels = ['email', 'phone', 'mail', 'in_person']
  return validChannels.includes(channel) ? (channel as any) : 'email'
}

/**
 * Batch generate actions for multiple donors
 */
export async function batchGenerateCopilotActions(
  contactIds: string[]
): Promise<Map<string, CopilotAction>> {
  const actions = new Map<string, CopilotAction>()

  // Process in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < contactIds.length; i += batchSize) {
    const batch = contactIds.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map(id => generateCopilotAction(id))
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        actions.set(batch[index], result.value)
      } else {
        console.error(`Failed to generate action for donor ${batch[index]}:`, result.reason)
      }
    })

    // Small delay between batches to respect rate limits
    if (i + batchSize < contactIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return actions
}

/**
 * Select top priority donors for action generation
 *
 * This function analyzes all donors and selects the top N candidates
 * for AI action generation based on strategic criteria.
 */
export async function selectTopPriorityDonors(
  organizationId: string,
  limit: number = 20
): Promise<string[]> {
  // This would typically query the database to find:
  // 1. High lapse risk donors
  // 2. Major donors ready for asks
  // 3. Recent givers needing stewardship
  // 4. High-potential prospects
  //
  // For now, returning empty array - will be implemented in the Inngest function
  // which has access to the Supabase client
  return []
}
