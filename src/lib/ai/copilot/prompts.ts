/**
 * AI Fundraising Copilot - Prompts
 *
 * Prompt templates for generating fundraising action suggestions.
 */

import { DonorContext, serializeContext } from '@/lib/ai/context/builder'
import { DonorScore } from './donor-scorer'

/**
 * System prompt for the fundraising copilot
 */
export function getCopilotSystemPrompt(): string {
  return `You are Flora, an AI fundraising expert and strategic advisor for nonprofit organizations. You have deep expertise in:

- Donor psychology and behavior patterns
- Major gifts fundraising strategies
- Donor retention and re-engagement
- Personalized cultivation approaches
- Optimal timing for asks and outreach
- Building authentic donor relationships

Your role is to analyze donor data and generate specific, actionable fundraising recommendations that maximize both donor satisfaction and fundraising effectiveness.

CORE PRINCIPLES:
1. Donor-Centric: Always prioritize authentic relationship-building over transactional asks
2. Strategic: Consider timing, donor capacity, and organizational needs
3. Personalized: Tailor every suggestion to the specific donor's history and preferences
4. Actionable: Provide clear, concrete next steps that can be executed immediately
5. Mission-Focused: Connect fundraising to impact and organizational mission

ACTION TYPES YOU CAN RECOMMEND:
- reach_out: General relationship-building contact (no ask)
- send_ask: Solicitation for a specific gift amount
- re_engage: Re-activation campaign for lapsed/lapsing donors
- thank: Gratitude and stewardship contact
- follow_up: Continue conversation from previous interaction

IMPORTANT: You must respond ONLY with valid JSON. No markdown, no explanations outside the JSON structure.`
}

/**
 * User prompt for generating copilot actions
 */
export function getCopilotUserPrompt(
  context: DonorContext,
  score: DonorScore,
  currentDate: Date = new Date()
): string {
  const contextStr = serializeContext(context)
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const dayOfYear = Math.floor(
    (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Calculate time context
  const isYearEnd = currentDate.getMonth() >= 10 // Nov-Dec
  const isGivingTuesday = currentDate.getMonth() === 10 && currentDate.getDate() >= 25 // Late Nov
  const isSpringtime = currentDate.getMonth() >= 2 && currentDate.getMonth() <= 4

  return `${contextStr}

DONOR SCORE ANALYSIS:
- Overall Score: ${score.score}/100
- Predicted Success Rate: ${score.predictedSuccessRate}%
- Predicted Gift Amount: ${score.predictedGiftAmount ? `$${score.predictedGiftAmount.toFixed(2)}` : 'N/A'}
- Optimal Timing: ${score.optimalTiming}
- Preferred Channel: ${score.preferredChannel}
- Lapse Risk: ${score.lapseRisk}
${score.daysUntilLapse !== null ? `- Days Until Expected Lapse: ${score.daysUntilLapse}` : ''}

SCORING BREAKDOWN:
- Giving History Score: ${score.engagementFactors.givingHistory}/25
- Recency Score: ${score.engagementFactors.recency}/25
- Frequency Score: ${score.engagementFactors.frequency}/25
- Trend Score: ${score.engagementFactors.trend}/25

REASONING: ${score.scoreReasoning}

CURRENT DATE CONTEXT:
- Today: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Month: ${monthName}
- Time of Year: ${isYearEnd ? 'Year-End Giving Season' : isSpringtime ? 'Spring Campaign Season' : 'Regular Season'}
${isGivingTuesday ? '- SPECIAL: Giving Tuesday is this week!' : ''}

Based on this comprehensive analysis, generate ONE specific fundraising action recommendation for this donor.

Respond with JSON in this exact format:
{
  "actionType": "<one of: reach_out, send_ask, re_engage, thank, follow_up>",
  "priority": <1-100, where 100 is highest priority>,
  "title": "<Concise action title, 5-8 words>",
  "description": "<Specific action description, 15-25 words explaining what to do>",
  "reasoning": "<Detailed explanation of WHY this action, WHY now, and expected impact. 3-4 sentences.>",
  "predictedGiftAmount": <number or null>,
  "predictedSuccessRate": <0-100>,
  "optimalTiming": "<specific timing recommendation>",
  "preferredChannel": "<email|phone|mail|in_person>"
}

DECISION GUIDELINES:

For HIGH LAPSE RISK donors:
- Prioritize "re_engage" actions
- Focus on relationship rebuilding, not immediate asks
- Acknowledge the gap in giving
- Use warmer, more personal channels (phone/in-person for major donors)

For HIGH SCORING donors (70-100):
- Consider "send_ask" if timing is right and no recent ask
- Use "reach_out" for cultivation before major asks
- Personalize to their specific interests/history
- Match ask amount to their capacity and patterns

For RECENT GIVERS:
- Prioritize "thank" actions for gifts in last 30 days
- Use "follow_up" to continue momentum
- Focus on impact reporting and stewardship

For MAJOR DONORS ($1000+ lifetime):
- Recommend personal channels (phone, in-person)
- Suggest specific ask amounts based on history
- Emphasize relationship depth over frequency

For FIRST-TIME donors:
- Focus on "thank" and "reach_out" to build relationship
- Don't ask again too quickly (wait 90+ days)
- Welcome them to community

TIMING CONSIDERATIONS:
- Year-end (Nov-Dec): Higher urgency for asks, tax benefits
- Post-gift: Focus on gratitude (7-14 days after)
- Lapse risk: Urgent re-engagement within their giving cycle
- Optimal window: Match to predicted timing from score

Set priority based on:
- Urgency (lapse risk, time-sensitive opportunities)
- Potential impact (gift size, donor importance)
- Readiness (donor score, timing alignment)
- Strategic value (major donor cultivation, re-engagement potential)`
}

/**
 * Prompt for batch action generation (organization-wide)
 */
export function getBatchCopilotPrompt(
  donorCount: number,
  organizationName: string,
  currentGoals?: {
    monthlyTarget?: number
    yearEndTarget?: number
    activeDonors?: number
  }
): string {
  const goalsContext = currentGoals
    ? `
ORGANIZATIONAL GOALS:
${currentGoals.monthlyTarget ? `- Monthly Fundraising Target: $${currentGoals.monthlyTarget.toLocaleString()}` : ''}
${currentGoals.yearEndTarget ? `- Year-End Target: $${currentGoals.yearEndTarget.toLocaleString()}` : ''}
${currentGoals.activeDonors ? `- Active Donor Goal: ${currentGoals.activeDonors} donors` : ''}
`
    : ''

  return `You are analyzing the donor database for ${organizationName} to generate strategic fundraising action recommendations.

SCOPE:
- Total Donors to Analyze: ${donorCount}
- Goal: Identify the top 10-20 highest-priority actions for TODAY

${goalsContext}

SELECTION CRITERIA:
1. Urgency - Time-sensitive opportunities (lapse risk, optimal timing windows)
2. Impact - Potential gift size and strategic importance
3. Readiness - High donor scores and favorable conditions
4. Balance - Mix of asks, stewardship, and cultivation

PRIORITIZATION RULES:
- High lapse risk + high historic value = TOP PRIORITY (90-100)
- Major donor ready for ask = HIGH PRIORITY (75-90)
- Stewardship of recent major gifts = HIGH PRIORITY (70-85)
- Cultivation of emerging donors = MEDIUM PRIORITY (50-70)
- Routine follow-ups = LOWER PRIORITY (30-50)

Generate a balanced portfolio of actions that:
- Prevents donor attrition (re-engage lapsing donors)
- Capitalizes on hot prospects (ready for asks)
- Maintains relationships (stewardship and cultivation)
- Builds pipeline (new donor engagement)`
}

/**
 * Get examples of high-quality copilot actions for reference
 */
export function getCopilotActionExamples(): Array<{
  context: string
  action: string
}> {
  return [
    {
      context: 'Major donor, last gift 14 months ago, $5,000 average gift, high lapse risk',
      action: JSON.stringify({
        actionType: 're_engage',
        priority: 95,
        title: 'Re-engage Sarah before she lapses completely',
        description: 'Personal phone call to reconnect, share impact update, and understand her current interests before making any ask.',
        reasoning: 'Sarah is a major donor ($15K lifetime) who hasn\'t given in 14 months - well past her 12-month average giving cycle. High urgency to re-engage before she fully lapses. This is relationship-building only, no ask. Focus on learning why she stepped back and rebuilding connection.',
        predictedGiftAmount: 5000,
        predictedSuccessRate: 65,
        optimalTiming: 'This week',
        preferredChannel: 'phone',
      }, null, 2),
    },
    {
      context: 'Regular donor, 3 consecutive gifts, last gift 45 days ago, $250 average',
      action: JSON.stringify({
        actionType: 'thank',
        priority: 75,
        title: 'Send impact report to Michael for recent gift',
        description: 'Email personalized impact story showing how his last $250 gift made a difference, with photos and specific outcomes.',
        reasoning: 'Michael is building a consistent giving pattern (3 consecutive gifts). Timely stewardship now will reinforce his decision and strengthen the relationship. This is pure gratitude - no ask attached. Sets up potential for upgrade ask in 60-90 days.',
        predictedGiftAmount: null,
        predictedSuccessRate: 90,
        optimalTiming: 'This week',
        preferredChannel: 'email',
      }, null, 2),
    },
    {
      context: 'Donor with increasing gift trend, last gift $500, average $300, 90 days ago',
      action: JSON.stringify({
        actionType: 'send_ask',
        priority: 85,
        title: 'Request $750 year-end gift from Jennifer',
        description: 'Personal email with specific project need, asking for $750 gift to fund program expansion she previously supported.',
        reasoning: 'Jennifer shows strong positive trend - gifts increasing from $200 to $500 over 2 years. She\'s within her normal giving cycle (gives every 90-120 days) and we\'re in year-end giving season. Perfect timing to ask for stretch gift of $750, which is realistic given her trajectory and capacity signals.',
        predictedGiftAmount: 750,
        predictedSuccessRate: 72,
        optimalTiming: 'This week',
        preferredChannel: 'email',
      }, null, 2),
    },
  ]
}
