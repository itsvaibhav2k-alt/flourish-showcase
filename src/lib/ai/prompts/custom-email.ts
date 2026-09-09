/**
 * Custom Email Generation Prompts
 *
 * System and user prompts for generating fully custom AI-powered emails
 * based on user-defined topic, key points, tone, and call-to-action.
 */

import { VoiceProfile, getVoiceInstructions } from './voice-analysis'
import { DonorContext, VolunteerContext, serializeContext, OrganizationVoiceContext, serializeOrganizationVoiceContext } from '../context/builder'

/**
 * Parameters for custom email generation
 */
export interface CustomEmailParams {
  topic: string
  keyPoints?: string[]
  tone?: 'warm' | 'professional' | 'casual' | 'formal' | 'spiritual' | 'urgent'
  callToAction?: string
  subjectHint?: string
}

/**
 * Get tone guidance based on selected tone
 */
function getToneGuidance(tone: string): string {
  const tones: Record<string, string> = {
    warm: 'Use a warm, friendly tone that feels personal and heartfelt. Show genuine care and make the recipient feel valued and appreciated.',
    professional: 'Maintain a polished, professional tone while still being personable. Balance formality with warmth and ensure clarity.',
    casual: 'Write in a relaxed, conversational style as if talking to a friend. Keep it genuine, approachable, and easy to read.',
    formal: 'Use traditional, respectful language appropriate for formal correspondence. Maintain dignity and professionalism throughout.',
    spiritual: 'Incorporate faith-based language and inspirational elements. Connect on a deeper, more meaningful level with hope and gratitude.',
    urgent: 'Convey importance and timeliness without being pushy. Create a sense of meaningful urgency while remaining respectful.',
  }
  return tones[tone] || tones['warm']
}

/**
 * Get the system prompt for custom email generation
 */
export function getCustomEmailSystemPrompt(
  voiceProfile: VoiceProfile,
  customParams: CustomEmailParams,
  orgVoiceContext?: OrganizationVoiceContext
): string {
  const selectedTone = customParams.tone || 'warm'
  const toneGuidance = getToneGuidance(selectedTone)

  return `You are an expert nonprofit communications professional writing a custom email.

${getVoiceInstructions(voiceProfile)}

${orgVoiceContext ? serializeOrganizationVoiceContext(orgVoiceContext) : ''}

EMAIL TOPIC/PURPOSE:
${customParams.topic}

${customParams.keyPoints && customParams.keyPoints.length > 0 ? `
KEY POINTS TO INCLUDE:
${customParams.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

IMPORTANT: You MUST incorporate ALL key points naturally into the email. Do not skip any.
` : ''}

TONE GUIDANCE:
${toneGuidance}

${customParams.callToAction ? `
CALL-TO-ACTION:
Include this specific call-to-action: "${customParams.callToAction}"
Make the CTA clear, compelling, and easy to act on.
` : ''}

${customParams.subjectHint ? `
SUBJECT LINE GUIDANCE:
The user suggests: "${customParams.subjectHint}"
Use this as inspiration for the subject line, but you may refine it to be more compelling.
` : ''}

YOUR TASK:
Write a personalized email that:
1. Addresses the topic/purpose clearly and engagingly
2. Incorporates all provided key points naturally
3. Matches the specified tone perfectly
4. Includes a clear call-to-action if provided
5. Feels genuine and personal to the recipient
6. Aligns with the organization's voice profile

EMAIL REQUIREMENTS:

LENGTH:
- Standard: 150-250 words
- With multiple key points: 200-300 words
- Keep it concise but comprehensive

STRUCTURE:
1. Personal greeting using their first name
2. Opening that establishes context and relevance
3. Body content addressing the topic and key points
4. Call-to-action (if provided) or forward-looking statement
5. Warm closing that reinforces the relationship

TONE & STYLE:
- ${selectedTone.toUpperCase()}: ${toneGuidance.split('.')[0]}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}

PERSONALIZATION RULES:
- Reference recipient's history and relationship when relevant
- Acknowledge their past support or involvement
- Make connections between the topic and their interests
- Use specific details to show the email is meant for them

CRITICAL RULES:
- Make it feel genuine and personal, NOT templated
- Focus on VALUE and IMPACT over transactions
- Keep paragraphs short (2-3 sentences max)
- No generic or placeholder language
- Match the organization's voice exactly
- If key points are provided, include ALL of them

OUTPUT FORMAT:
Subject: [compelling subject line]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

/**
 * Get the user prompt for custom email generation with donor context
 */
export function getCustomEmailUserPrompt(
  context: DonorContext,
  customParams: CustomEmailParams
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

CUSTOM EMAIL REQUEST:
- Topic: ${customParams.topic}
${customParams.keyPoints && customParams.keyPoints.length > 0 ? `- Key Points: ${customParams.keyPoints.join('; ')}` : ''}
${customParams.tone ? `- Tone: ${customParams.tone}` : ''}
${customParams.callToAction ? `- Call-to-Action: ${customParams.callToAction}` : ''}
${customParams.subjectHint ? `- Subject Hint: ${customParams.subjectHint}` : ''}

Generate a custom email following all guidelines. Make it personal, specific, and aligned with the topic.

Important personalization considerations:
${getCustomPersonalizationGuidance(context, customParams)}

Output format:
Subject: [compelling subject line that matches the topic and tone]

[email body - follow all structure, key points, and tone requirements]`
}

/**
 * Get the user prompt for custom email generation with volunteer context
 */
export function getCustomEmailUserPromptVolunteer(
  context: VolunteerContext,
  customParams: CustomEmailParams
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

CUSTOM EMAIL REQUEST:
- Topic: ${customParams.topic}
${customParams.keyPoints && customParams.keyPoints.length > 0 ? `- Key Points: ${customParams.keyPoints.join('; ')}` : ''}
${customParams.tone ? `- Tone: ${customParams.tone}` : ''}
${customParams.callToAction ? `- Call-to-Action: ${customParams.callToAction}` : ''}
${customParams.subjectHint ? `- Subject Hint: ${customParams.subjectHint}` : ''}

Generate a custom email for this volunteer following all guidelines. Make it personal, specific, and aligned with the topic.

Important personalization considerations:
${getVolunteerPersonalizationGuidance(context, customParams)}

Output format:
Subject: [compelling subject line that matches the topic and tone]

[email body - follow all structure, key points, and tone requirements]`
}

/**
 * Generate personalization guidance based on donor context
 */
function getCustomPersonalizationGuidance(
  context: DonorContext,
  customParams: CustomEmailParams
): string {
  const guidance: string[] = []

  // First-time or new contact
  if (context.giving.totalGifts === 0) {
    guidance.push('- This is a new contact/prospect - focus on introducing the topic and building interest')
  } else if (context.giving.totalGifts === 1) {
    guidance.push('- First-time donor - acknowledge their recent support and welcome them')
  }

  // Returning donor
  if (context.giving.totalGifts > 1) {
    guidance.push(
      `- Returning supporter with ${context.giving.totalGifts} gifts over ${context.relationship.yearsOfSupport} year(s) - acknowledge their ongoing relationship`
    )
  }

  // Major donor
  if (context.relationship.segment === 'Major Donor' || context.giving.lifetimeGiving >= 1000) {
    guidance.push(
      '- Significant supporter - ensure the email feels appropriately special and personal'
    )
  }

  // High engagement
  if (context.relationship.engagementScore > 70) {
    guidance.push(
      '- Highly engaged contact - they likely appreciate more detailed communications'
    )
  }

  // Low engagement
  if (context.relationship.engagementScore < 30 && context.giving.totalGifts > 0) {
    guidance.push(
      '- Lower engagement recently - focus on re-connecting and showing value'
    )
  }

  // Recent activity
  if (context.recentActivities.length > 0) {
    const recentActivity = context.recentActivities[0]
    guidance.push(
      `- Recent activity: ${recentActivity.activityType} - reference if relevant to the topic`
    )
  }

  // Topic-specific guidance
  if (customParams.topic.toLowerCase().includes('event')) {
    guidance.push('- Event-related topic - emphasize community and participation')
  }

  if (customParams.topic.toLowerCase().includes('appeal') || customParams.topic.toLowerCase().includes('campaign')) {
    guidance.push('- Fundraising topic - focus on impact and how their support makes a difference')
  }

  if (customParams.topic.toLowerCase().includes('update') || customParams.topic.toLowerCase().includes('news')) {
    guidance.push('- Update/news topic - emphasize their role in the story and outcomes')
  }

  return guidance.length > 0
    ? guidance.join('\n')
    : '- Standard personalization based on available context'
}

/**
 * Generate personalization guidance based on volunteer context
 */
function getVolunteerPersonalizationGuidance(
  context: VolunteerContext,
  customParams: CustomEmailParams
): string {
  const guidance: string[] = []

  // New volunteer
  if (context.volunteerHistory.totalShifts === 0) {
    guidance.push('- New volunteer with no completed shifts yet - focus on welcoming and engagement')
  }

  // Experienced volunteer
  if (context.volunteerHistory.totalShifts >= 5) {
    guidance.push(
      `- Experienced volunteer with ${context.volunteerHistory.totalShifts} shifts and ${context.volunteerHistory.totalHours} hours - acknowledge their dedication`
    )
  }

  // Has upcoming shifts
  if (context.volunteerHistory.upcomingShifts > 0) {
    guidance.push(
      `- Has ${context.volunteerHistory.upcomingShifts} upcoming shift(s) - they're actively engaged`
    )
  }

  // Been away
  if (context.volunteerHistory.totalShifts > 0 && context.volunteerHistory.upcomingShifts === 0) {
    const lastShift = context.volunteerHistory.lastShiftDate
    if (lastShift) {
      guidance.push(
        '- No upcoming shifts currently - consider inviting them to get involved again'
      )
    }
  }

  // Current shift context
  if (context.currentShift) {
    guidance.push(
      `- Reference to their upcoming shift "${context.currentShift.title}" may be relevant`
    )
  }

  return guidance.length > 0
    ? guidance.join('\n')
    : '- Standard personalization based on available volunteer context'
}

/**
 * Get example custom emails for reference
 */
export function getCustomEmailExamples(): Array<{
  params: CustomEmailParams
  context: string
  email: string
}> {
  return [
    {
      params: {
        topic: 'Annual Gala Invitation',
        keyPoints: [
          'Event is on December 15th at the Grand Ballroom',
          'Featuring keynote speaker Dr. Jane Smith',
          'Proceeds support youth education programs',
        ],
        tone: 'warm',
        callToAction: 'RSVP by December 1st',
      },
      context: 'Long-time donor, $500+ lifetime giving, high engagement',
      email: `Subject: You're Invited: A Special Evening for Our Champions

Hi Sarah,

Your five years of support have been instrumental in changing young lives, and we'd be honored to celebrate that impact with you at our Annual Gala.

Join us on December 15th at the Grand Ballroom for an unforgettable evening. Our keynote speaker, Dr. Jane Smith, will share inspiring stories of how supporters like you have transformed our youth education programs.

Every dollar raised that night goes directly to providing tutoring, mentorship, and after-school support to students who need it most - the same programs your generosity has championed.

We truly hope you can join us. Please RSVP by December 1st to secure your seat.

With gratitude,`,
    },
    {
      params: {
        topic: 'Year-End Giving Campaign',
        keyPoints: [
          'Matching gift opportunity - all gifts doubled',
          'Goal is to raise $50,000 by December 31st',
          'Funds will support spring programs',
        ],
        tone: 'urgent',
        callToAction: 'Make a gift today to have it matched',
        subjectHint: 'Double your impact',
      },
      context: 'Previous donor, 6 months since last gift, medium engagement',
      email: `Subject: Double Your Impact Before Midnight on New Year's Eve

Hi Michael,

This is a special moment, and I wanted to make sure you knew about it.

A generous supporter has offered to match every gift we receive dollar-for-dollar through December 31st. That means your gift today will be DOUBLED - twice the impact for students counting on us this spring.

We're working toward raising $50,000 to fully fund our spring programs, including after-school tutoring and weekend workshops. We're close, but we need your help to get there.

The last time you gave, your $75 helped provide two weeks of tutoring for a struggling student. Imagine what $150 worth of impact could do - without costing you a penny more.

Make a gift today to have it matched before this opportunity ends.

Gratefully,`,
    },
  ]
}
