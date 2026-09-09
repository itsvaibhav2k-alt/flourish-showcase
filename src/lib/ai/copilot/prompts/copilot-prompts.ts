/**
 * AI Fundraising Copilot - Prompt Templates
 *
 * Prompts for generating smart action suggestions and predictions
 */

import { DonorContext, serializeContext } from '@/lib/ai/context/builder'
import { DonorScore } from '../donor-scorer'

/**
 * System prompt for action generation
 */
export function getActionGenerationSystemPrompt(): string {
  return `You are an expert nonprofit fundraising strategist and relationship manager. Your role is to analyze donor data and recommend the most impactful actions a development professional should take.

You have deep expertise in:
- Donor lifecycle management and retention strategies
- Major gifts cultivation and solicitation timing
- Re-engagement campaigns for lapsed donors
- Stewardship best practices
- Fundraising psychology and donor motivation

Your recommendations should be:
- Actionable and specific (not generic advice)
- Data-driven based on giving patterns and engagement
- Prioritized by potential impact and urgency
- Personalized to each donor's unique relationship
- Respectful of donor fatigue and appropriate timing

CRITICAL RULES:
- ONLY suggest actions that are appropriate for the current donor state
- Consider time since last contact/gift
- Don't recommend asks too soon after a gift (stewardship first)
- Major donors deserve more personal, high-touch actions
- New donors need cultivation before major asks
- Be sensitive to engagement patterns and lapse risk

OUTPUT FORMAT:
You must respond with valid JSON only. No markdown, no explanations outside JSON.`
}

/**
 * User prompt for generating a single action for a donor
 */
export function getActionGenerationUserPrompt(
  context: DonorContext,
  score: DonorScore
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

DONOR SCORE ANALYSIS:
- Overall Score: ${score.score}/100
- Predicted Gift Amount: ${score.predictedGiftAmount ? `$${score.predictedGiftAmount.toFixed(2)}` : 'Unknown'}
- Success Rate: ${score.predictedSuccessRate}%
- Optimal Timing: ${score.optimalTiming}
- Preferred Channel: ${score.preferredChannel}
- Lapse Risk: ${score.lapseRisk}
${score.daysUntilLapse ? `- Days Until Expected Lapse: ${score.daysUntilLapse}` : ''}

ENGAGEMENT FACTORS:
- Giving History: ${score.engagementFactors.givingHistory}/25
- Recency: ${score.engagementFactors.recency}/25
- Frequency: ${score.engagementFactors.frequency}/25
- Trend: ${score.engagementFactors.trend}/25

SCORE REASONING:
${score.scoreReasoning}

Based on this comprehensive donor analysis, recommend THE SINGLE BEST action to take with this donor right now.

Consider:
1. Where they are in the donor lifecycle
2. Time since last gift and last contact
3. Their giving capacity and patterns
4. Lapse risk and urgency
5. Appropriate next steps (don't ask too soon after a gift!)

Respond with this exact JSON structure:
{
  "action_type": "<one of: 'reach_out', 'send_ask', 're_engage', 'thank', 'follow_up'>",
  "title": "Brief action title (5-8 words)",
  "description": "Specific action to take (1-2 sentences, max 150 chars)",
  "reasoning": "Why this action now? What data supports it? (2-3 sentences)",
  "priority": <1-10, where 10 is most urgent>,
  "timing_note": "When to do this (e.g., 'This week', 'Before month-end')"
}

ACTION TYPE DEFINITIONS:
- "reach_out": General check-in, relationship building, no ask
- "send_ask": Solicit a gift (only if timing is appropriate)
- "re_engage": Reconnect with lapsed/inactive donor
- "thank": Express gratitude, stewardship (only if recent gift and not already thanked)
- "follow_up": Follow up on previous contact or gift

IMPORTANT CONSTRAINTS:
- Don't suggest "thank" if gift was >30 days ago (likely already thanked)
- Don't suggest "send_ask" if gift was <90 days ago (too soon)
- Don't suggest "send_ask" for lapsed donors (re_engage first)
- Prioritize high-value relationships (major donors, high engagement)
- Consider fatigue: frequent givers may need space between contacts`
}

/**
 * User prompt for batch action generation across multiple donors
 */
export function getBatchActionGenerationUserPrompt(
  donors: Array<{
    context: DonorContext
    score: DonorScore
  }>,
  limit: number = 10
): string {
  const donorSummaries = donors.map((d, i) => {
    return `
DONOR ${i + 1}: ${d.context.donor.fullName}
- Segment: ${d.context.relationship.segment}
- Lifetime Giving: $${d.context.giving.lifetimeGiving.toFixed(2)}
- Last Gift: ${d.context.giving.lastGiftDate || 'Never'}
- Score: ${d.score.score}/100
- Lapse Risk: ${d.score.lapseRisk}
- Predicted Success Rate: ${d.score.predictedSuccessRate}%`
  }).join('\n')

  return `Analyze these ${donors.length} donors and recommend the TOP ${limit} actions that would have the most impact on fundraising success.

${donorSummaries}

Rank and select the ${limit} most impactful actions considering:
1. Urgency (lapse risk, timing windows)
2. Potential gift value (major donors, predicted amounts)
3. Success likelihood (engagement scores)
4. Strategic importance (new vs. lapsed vs. loyal)

Respond with a JSON array of the top ${limit} actions in priority order:
[
  {
    "donor_name": "Full Name",
    "donor_index": <0-based index from list above>,
    "action_type": "<reach_out|send_ask|re_engage|thank|follow_up>",
    "title": "Brief action title",
    "description": "Specific action to take (max 150 chars)",
    "reasoning": "Why this action is high priority (2-3 sentences)",
    "priority": <1-10>
  }
]

Only return valid JSON array, no other text.`
}

/**
 * Context building for action generation
 */
export function buildActionGenerationContext(
  context: DonorContext,
  score: DonorScore
): {
  donorSummary: string
  keyInsights: string[]
  recommendedFocus: string
} {
  const insights: string[] = []

  // Analyze giving patterns
  if (context.giving.totalGifts === 1) {
    insights.push('First-time donor - needs cultivation and stewardship')
  } else if (context.giving.totalGifts >= 10) {
    insights.push(`Loyal supporter with ${context.giving.totalGifts} gifts over ${context.relationship.yearsOfSupport} years`)
  }

  // Analyze recency
  if (context.giving.lastGiftDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(context.giving.lastGiftDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSince <= 30) {
      insights.push('Recent gift - focus on stewardship, not solicitation')
    } else if (daysSince >= 365) {
      insights.push('No gift in over a year - re-engagement critical')
    }
  }

  // Analyze segment
  if (context.relationship.segment === 'Major Donor') {
    insights.push('Major donor - deserves high-touch, personalized engagement')
  }

  // Analyze lapse risk
  if (score.lapseRisk === 'high') {
    insights.push('HIGH lapse risk - immediate action needed')
  } else if (score.lapseRisk === 'medium') {
    insights.push('Medium lapse risk - proactive outreach recommended')
  }

  // Analyze trend
  if (score.engagementFactors.trend >= 20) {
    insights.push('Giving is increasing - strong cultivation opportunity')
  } else if (score.engagementFactors.trend <= 10) {
    insights.push('Giving declining - needs attention')
  }

  // Determine focus
  let recommendedFocus = 'relationship_building'
  if (score.lapseRisk === 'high') {
    recommendedFocus = 'retention'
  } else if (context.relationship.segment === 'Major Donor' && score.score >= 70) {
    recommendedFocus = 'cultivation'
  } else if (context.giving.totalGifts === 1) {
    recommendedFocus = 'stewardship'
  }

  return {
    donorSummary: `${context.donor.fullName} - ${context.relationship.segment}, ${context.giving.totalGifts} gifts, $${context.giving.lifetimeGiving.toFixed(2)} lifetime`,
    keyInsights: insights,
    recommendedFocus,
  }
}

/**
 * Get example actions for reference (training data)
 */
export function getExampleActions(): Array<{
  scenario: string
  action: {
    action_type: string
    title: string
    description: string
    reasoning: string
    priority: number
  }
}> {
  return [
    {
      scenario: 'Major donor, gave $5000 three months ago, 10 total gifts',
      action: {
        action_type: 'reach_out',
        title: 'Schedule coffee with Sarah',
        description: 'Personal meeting to discuss impact and future partnership opportunities',
        reasoning: 'Major donor relationship building. Three months post-gift is perfect timing for stewardship without solicitation. High engagement score indicates receptiveness.',
        priority: 9,
      },
    },
    {
      scenario: 'Lapsed donor, last gift 18 months ago, $250 average gift, 5 total gifts',
      action: {
        action_type: 're_engage',
        title: 'Re-engagement email to Michael',
        description: 'Personal note acknowledging their past support and sharing recent impact',
        reasoning: 'High lapse risk with 18 months since last gift. Previously reliable donor worth re-engaging. Email is appropriate for mid-level donor.',
        priority: 8,
      },
    },
    {
      scenario: 'First-time donor, $100 gift 2 weeks ago',
      action: {
        action_type: 'thank',
        title: 'Thank you call to Jennifer',
        description: 'Personal phone call thanking her for first gift and welcoming her to community',
        reasoning: 'First gift within 30 days - critical stewardship moment. Personal touch builds loyalty. Too soon for any solicitation.',
        priority: 7,
      },
    },
    {
      scenario: 'Regular donor, $500 gifts quarterly for 3 years, last gift 4 months ago',
      action: {
        action_type: 'send_ask',
        title: 'Quarterly gift request to David',
        description: 'Email solicitation highlighting specific program need, suggest $500-$750',
        reasoning: 'Reliable quarterly donor now past their cycle by one month. Timing is right for renewal ask. Strong engagement score indicates high likelihood of response.',
        priority: 8,
      },
    },
    {
      scenario: 'New prospect, attended event 1 month ago, no gifts yet',
      action: {
        action_type: 'reach_out',
        title: 'Follow up call with Alex',
        description: 'Call to discuss event experience and learn about their interests',
        reasoning: 'Recent event attendance shows interest. Need to build relationship before asking. Discovery call can uncover giving capacity and motivations.',
        priority: 6,
      },
    },
  ]
}
