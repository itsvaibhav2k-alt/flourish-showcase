/**
 * Thank You Email Prompts
 *
 * System and user prompts for generating donor thank-you emails.
 */

import { VoiceProfile, getVoiceInstructions } from './voice-analysis'
import { DonorContext, serializeContext, OrganizationVoiceContext, serializeOrganizationVoiceContext } from '../context/builder'
import { GiftContext } from '../context/builder'

export function getThankYouSystemPrompt(
  voiceProfile: VoiceProfile,
  orgVoiceContext?: OrganizationVoiceContext
): string {
  const toneGuidance = getToneGuidance(orgVoiceContext?.tonePreset || 'warm')

  return `You are an expert nonprofit fundraising professional writing donor thank-you emails.

${getVoiceInstructions(voiceProfile)}

${orgVoiceContext ? serializeOrganizationVoiceContext(orgVoiceContext) : ''}

TONE GUIDANCE:
${toneGuidance}

YOUR TASK:
Write a personalized thank-you email that expresses genuine gratitude and reinforces the donor's impact.

EMAIL REQUIREMENTS:

LENGTH:
- Major Donors ($1000+): 150-250 words
- Mid-Level Donors ($100-999): 100-150 words
- Regular Donors (<$100): 75-125 words

STRUCTURE:
1. Personal greeting using their first name
2. Immediate gratitude - thank them right away
3. Impact statement - what their gift accomplishes
4. Personal touch - reference their history or relationship
5. Forward-looking statement - the work continues
6. Warm closing

TONE & STYLE:
- ${voiceProfile.formality === 'formal' ? 'Professional and respectful' : voiceProfile.formality === 'casual' ? 'Warm and conversational' : 'Professional yet friendly'}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}

PERSONALIZATION RULES:
- Use specific gift amount and date
- Reference donor segment (first-time, recurring, major, etc.)
- Mention specific campaigns or programs when relevant
- Acknowledge years of support for long-time donors
- Reference past gifts for returning donors

CRITICAL RULES:
- Make it feel genuine and personal, NOT templated
- Focus on IMPACT over features
- Express gratitude WITHOUT being transactional
- Keep paragraphs short (2-3 sentences max)
- No "Dear Donor" or generic language
- No asking for another gift in a thank-you
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [subject line]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

function getToneGuidance(preset: string): string {
  const tones: Record<string, string> = {
    warm: 'Use a warm, friendly tone that feels personal and heartfelt. Show genuine appreciation and make the donor feel valued.',
    professional: 'Maintain a polished, professional tone while still expressing sincere gratitude. Balance formality with warmth.',
    casual: 'Write in a relaxed, conversational style as if talking to a friend. Keep it genuine and approachable.',
    formal: 'Use traditional, respectful language appropriate for formal correspondence. Maintain dignity while expressing thanks.',
    spiritual: 'Incorporate faith-based language and inspirational elements. Connect on a deeper, more meaningful level.',
  }
  return tones[preset] || tones['warm']
}

export function getThankYouUserPrompt(
  context: DonorContext,
  gift: GiftContext
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

CURRENT GIFT TO THANK:
- Amount: $${gift.amount.toFixed(2)}
- Date: ${gift.date}
- Type: ${gift.giftType}
${gift.campaign ? `- Campaign: ${gift.campaign}` : ''}
${gift.paymentMethod ? `- Payment Method: ${gift.paymentMethod}` : ''}

Generate a thank-you email following all guidelines. Make it personal, specific, and impactful.

Important considerations:
${getPersonalizationGuidance(context, gift)}

Output format:
Subject: [compelling subject line that feels personal]

[email body - follow all structure and tone requirements]`
}

function getPersonalizationGuidance(
  context: DonorContext,
  gift: GiftContext
): string {
  const guidance: string[] = []

  // First-time donor
  if (context.giving.totalGifts === 1) {
    guidance.push(
      '- This is their FIRST gift - welcome them to the community, make them feel special'
    )
  }

  // Returning donor
  if (context.giving.totalGifts > 1) {
    guidance.push(
      `- They have given ${context.giving.totalGifts} times over ${context.relationship.yearsOfSupport} year(s) - acknowledge their ongoing support`
    )
  }

  // Major donor
  if (context.relationship.segment === 'Major Donor') {
    guidance.push(
      '- MAJOR DONOR - this email should feel extra special and personal, mention their leadership'
    )
  }

  // Gift size increase
  if (
    context.giving.avgGift > 0 &&
    gift.amount > context.giving.avgGift * 1.5
  ) {
    guidance.push(
      '- They increased their gift significantly - acknowledge this generous increase'
    )
  }

  // Campaign-specific
  if (gift.campaign) {
    guidance.push(
      `- Reference the specific campaign (${gift.campaign}) and its impact`
    )
  }

  // High engagement
  if (context.relationship.engagementScore > 70) {
    guidance.push(
      '- Highly engaged donor - acknowledge their consistent involvement'
    )
  }

  // Recent interaction
  if (
    context.recentActivities.length > 0 &&
    context.recentActivities[0].description
  ) {
    guidance.push(
      `- Recent interaction: ${context.recentActivities[0].description} - reference if relevant`
    )
  }

  return guidance.length > 0
    ? guidance.join('\n')
    : '- No special considerations'
}

/**
 * Get example thank-you emails for reference (not for direct use)
 */
export function getThankYouExamples(): Array<{
  context: string
  email: string
}> {
  return [
    {
      context: 'First-time donor, $50 gift',
      email: `Subject: Welcome to our community, Sarah!

Hi Sarah,

Thank you so much for your first gift of $50 to our food bank. Your generosity means more than you know.

Because of supporters like you, we can provide nutritious meals to 200 families every week. Your $50 gift will help us serve 25 meals to neighbors facing hunger.

We're so grateful to have you as part of our community. Thank you for choosing to make a difference.

With gratitude,`,
    },
    {
      context: 'Long-time donor, $250 gift, 5 years of support',
      email: `Subject: Five years of impact, Michael - thank you

Hi Michael,

Your $250 gift today marks five incredible years of partnership with us. Thank you for your continued trust and support.

Over these five years, your cumulative giving has helped us provide after-school programs to more than 500 students. This latest gift will fund tutoring materials for an entire semester.

Your loyalty inspires us every day. We're honored to have you with us on this journey.

With deep appreciation,`,
    },
  ]
}
