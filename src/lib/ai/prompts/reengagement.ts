/**
 * Re-engagement Email Prompts
 *
 * System and user prompts for generating lapsed donor re-engagement emails.
 */

import { VoiceProfile, getVoiceInstructions } from './voice-analysis'
import { DonorContext, serializeContext } from '../context/builder'

export function getReengagementSystemPrompt(voiceProfile: VoiceProfile): string {
  return `You are an expert nonprofit fundraising professional writing re-engagement emails for lapsed donors.

${getVoiceInstructions(voiceProfile)}

YOUR TASK:
Write a re-engagement email that reconnects with a lapsed donor in a genuine, non-pushy way.

EMAIL REQUIREMENTS:

LENGTH: 125-175 words

STRUCTURE:
1. Personal greeting - use their first name
2. Acknowledgment - recognize their past support
3. Update - share what's happened since they last gave
4. Impact reminder - what their previous gifts accomplished
5. Gentle invitation - invite them to rejoin, not demand
6. No-pressure closing - respect their decision

TONE & STYLE:
- ${voiceProfile.formality === 'formal' ? 'Professional and respectful' : voiceProfile.formality === 'casual' ? 'Warm and conversational' : 'Professional yet friendly'}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}
- More focus on RELATIONSHIP than transaction
- Grateful, not guilt-inducing

LAPSED DONOR PSYCHOLOGY:
- They may have forgotten about you
- They may have financial constraints
- They may have shifted priorities
- They need to feel valued, not just targeted

PERSONALIZATION RULES:
- Acknowledge their specific past support (amounts, campaigns)
- Reference how long they've been away (but gently)
- Mention their total impact from past gifts
- Use "we've missed you" energy, not "we need money" energy

CRITICAL RULES:
- NEVER guilt-trip or make them feel bad
- Don't assume why they stopped giving
- Focus on what's NEW and exciting
- Make it easy to say yes, but okay to say no
- Keep paragraphs short (2-3 sentences max)
- No pressure tactics or urgency manipulation
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [subject line that feels personal, not salesy]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

export function getReengagementUserPrompt(
  context: DonorContext,
  monthsSinceLastGift: number
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

LAPSED DONOR DETAILS:
- Last Gift: ${monthsSinceLastGift} months ago (${context.giving.lastGiftDate})
- Last Gift Amount: $${context.giving.lastGiftAmount?.toFixed(2) || '0.00'}
- Total Historical Giving: $${context.giving.lifetimeGiving.toFixed(2)}
- Total Gifts: ${context.giving.totalGifts}
- Donor Category: ${getLapsedCategory(monthsSinceLastGift)}

Generate a re-engagement email following all guidelines. Be warm, genuine, and relationship-focused.

Important considerations:
${getReengagementGuidance(context, monthsSinceLastGift)}

Output format:
Subject: [warm, personal subject line - avoid "we miss you" clichés]

[email body - follow all structure and tone requirements]`
}

function getLapsedCategory(months: number): string {
  if (months < 6) return 'Recently Lapsed'
  if (months < 12) return 'Moderately Lapsed'
  if (months < 24) return 'Long Lapsed'
  return 'Deeply Lapsed'
}

function getReengagementGuidance(
  context: DonorContext,
  monthsSinceLastGift: number
): string {
  const guidance: string[] = []

  // Recently lapsed
  if (monthsSinceLastGift < 6) {
    guidance.push(
      '- Only recently lapsed - use light touch, focus on updates and staying connected'
    )
  }

  // Long lapsed
  if (monthsSinceLastGift >= 12) {
    guidance.push(
      '- Been away a while - acknowledge the gap but don\'t dwell on it, focus on "what\'s new"'
    )
  }

  // Was a major donor
  if (context.relationship.segment === 'Major Donor' || context.giving.lifetimeGiving > 1000) {
    guidance.push(
      '- This was a significant supporter - extra personalization and gratitude for past impact'
    )
  }

  // Multiple years of support
  if (context.relationship.yearsOfSupport >= 3) {
    guidance.push(
      `- They supported for ${context.relationship.yearsOfSupport} years - acknowledge that loyalty and long relationship`
    )
  }

  // Many past gifts
  if (context.giving.totalGifts >= 5) {
    guidance.push(
      `- ${context.giving.totalGifts} total gifts shows strong past engagement - remind them of their impact`
    )
  }

  // Had recent interactions but no gift
  if (context.recentActivities.length > 0) {
    guidance.push(
      '- They\'ve interacted recently without giving - they may still be interested, just need the right invitation'
    )
  }

  return guidance.length > 0
    ? guidance.join('\n')
    : '- Standard re-engagement approach'
}

/**
 * Get example re-engagement emails for reference
 */
export function getReengagementExamples(): Array<{
  context: string
  email: string
}> {
  return [
    {
      context: 'Recently lapsed (4 months), regular donor, $100 average gift',
      email: `Subject: A quick update for you, Jennifer

Hi Jennifer,

I wanted to share some exciting news with you since your last gift in April.

Thanks to supporters like you, we've expanded our youth mentoring program to two new schools. The 47 students you helped support through your past gifts are thriving - and we're now serving 85 young people total.

I know life gets busy. If you'd like to continue being part of their success, we'd love to have you back. But either way, thank you for the difference you've already made.

Warm regards,`,
    },
    {
      context: 'Long lapsed (18 months), was a major donor, $500+ gifts',
      email: `Subject: Your impact lives on, Robert

Hi Robert,

I've been thinking about the incredible support you gave us over the years - more than $2,000 in total that helped transform our animal shelter.

I wanted you to know: the new kitten nursery you helped fund is still saving lives every day. This year alone, we've rescued 156 kittens who wouldn't have survived without that space.

We'd be honored to have you back as part of our work, but I mainly wanted to say thank you. Your past generosity created lasting change.

With gratitude,`,
    },
  ]
}
