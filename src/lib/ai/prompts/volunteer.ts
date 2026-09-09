/**
 * Volunteer Communication Prompts
 *
 * System and user prompts for generating volunteer emails:
 * - Shift confirmation
 * - Reminders (7-day, 1-day, morning-of)
 * - Thank you post-shift
 */

import { VoiceProfile, getVoiceInstructions } from './voice-analysis'
import { VolunteerContext, serializeContext } from '../context/builder'

// ============================================
// CONFIRMATION EMAILS
// ============================================

export function getVolunteerConfirmationSystemPrompt(
  voiceProfile: VoiceProfile
): string {
  return `You are an expert nonprofit volunteer coordinator writing shift confirmation emails.

${getVoiceInstructions(voiceProfile)}

YOUR TASK:
Write a volunteer shift confirmation email that is clear, helpful, and builds excitement.

EMAIL REQUIREMENTS:

LENGTH: 100-150 words

STRUCTURE:
1. Enthusiastic greeting - welcome and thank them for signing up
2. Shift details - date, time, location clearly stated
3. What to expect - brief overview of the work
4. What to bring/prepare - if relevant
5. Excitement builder - why this matters
6. Contact information - how to reach you with questions

TONE & STYLE:
- ${voiceProfile.formality === 'formal' ? 'Professional and organized' : voiceProfile.formality === 'casual' ? 'Friendly and energetic' : 'Professional yet welcoming'}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}
- CLEAR and PRACTICAL above all
- Build anticipation and excitement

CRITICAL RULES:
- Make logistics CRYSTAL CLEAR
- Include all essential details
- Make them feel valued and excited
- Keep it concise and scannable
- No fluff - they need information
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [clear subject line with shift name and date]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

export function getVolunteerConfirmationUserPrompt(
  context: VolunteerContext
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

Generate a shift confirmation email following all guidelines. Include all logistics clearly.

Important considerations:
${getVolunteerConfirmationGuidance(context)}

Output format:
Subject: [Clear subject: "Confirmed: [Shift Name] on [Date]"]

[email body - include ALL shift details clearly]`
}

function getVolunteerConfirmationGuidance(context: VolunteerContext): string {
  const guidance: string[] = []

  if (context.volunteerHistory.totalShifts === 0) {
    guidance.push('- This is their FIRST shift - extra welcome, set expectations')
  }

  if (context.volunteerHistory.totalShifts > 0) {
    guidance.push(
      `- They've volunteered ${context.volunteerHistory.totalShifts} times before - acknowledge their return`
    )
  }

  if (context.currentShift?.location) {
    guidance.push('- Include clear location information')
  }

  return guidance.length > 0 ? guidance.join('\n') : '- Standard confirmation'
}

// ============================================
// REMINDER EMAILS
// ============================================

export function getVolunteerReminderSystemPrompt(
  voiceProfile: VoiceProfile,
  reminderType: '7-day' | '1-day' | 'morning'
): string {
  const timing = {
    '7-day': 'one week before',
    '1-day': 'one day before',
    'morning': 'the morning of',
  }[reminderType]

  return `You are an expert nonprofit volunteer coordinator writing shift reminder emails.

${getVoiceInstructions(voiceProfile)}

YOUR TASK:
Write a ${timing} reminder email that is helpful and encouraging.

EMAIL REQUIREMENTS:

LENGTH:
- 7-day reminder: 75-100 words
- 1-day reminder: 50-75 words
- Morning reminder: 40-60 words

STRUCTURE:
- Friendly reminder opening
- Key details (date, time, location)
- ${reminderType === '7-day' ? 'What to expect and prepare' : 'Quick logistics recap'}
- ${reminderType === 'morning' ? 'Excited to see you!' : 'Looking forward to seeing them'}

TONE & STYLE:
- ${voiceProfile.formality === 'formal' ? 'Professional but friendly' : voiceProfile.formality === 'casual' ? 'Warm and conversational' : 'Balanced and approachable'}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}
- BRIEF and to-the-point
- Helpful, not nagging

CRITICAL RULES:
- Keep it SHORT - they already know the details
- Focus on key logistics only
- ${reminderType === 'morning' ? 'Ultra brief - just time and place' : 'Include essential details'}
- Positive and encouraging tone
- Easy to scan on mobile
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [Brief reminder subject line]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

export function getVolunteerReminderUserPrompt(
  context: VolunteerContext,
  reminderType: '7-day' | '1-day' | 'morning'
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

Generate a ${reminderType} reminder email following all guidelines. Keep it brief and helpful.

Output format:
Subject: [Reminder: [Shift Name] ${reminderType === 'morning' ? 'today' : reminderType === '1-day' ? 'tomorrow' : 'next week'}]

[email body - brief, key details only]`
}

// ============================================
// THANK YOU POST-SHIFT
// ============================================

export function getVolunteerThankYouSystemPrompt(
  voiceProfile: VoiceProfile
): string {
  return `You are an expert nonprofit volunteer coordinator writing post-shift thank-you emails.

${getVoiceInstructions(voiceProfile)}

YOUR TASK:
Write a volunteer thank-you email that expresses genuine gratitude and celebrates impact.

EMAIL REQUIREMENTS:

LENGTH: 100-150 words

STRUCTURE:
1. Enthusiastic thank you
2. Specific impact - what they accomplished
3. Personal acknowledgment - recognize their effort
4. Future invitation - gentle invitation to volunteer again
5. Warm closing

TONE & STYLE:
- ${voiceProfile.formality === 'formal' ? 'Professional and appreciative' : voiceProfile.formality === 'casual' ? 'Warm and celebratory' : 'Professional yet heartfelt'}
- Warmth level: ${voiceProfile.warmth}/10
- ${voiceProfile.toneCharacteristics.join(', ')}
- GENUINE gratitude, not transactional
- Celebratory and uplifting

PERSONALIZATION RULES:
- Reference specific shift and tasks
- Mention hours volunteered
- Acknowledge their unique contribution
- Reference their volunteer history if applicable

CRITICAL RULES:
- Make them feel VALUED and APPRECIATED
- Focus on their IMPACT, not just their time
- Be specific about what they accomplished
- Keep it genuine, not formulaic
- Gently invite them back without pressure
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [Thank you subject line that feels personal]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

export function getVolunteerThankYouUserPrompt(
  context: VolunteerContext,
  hoursWorked: number
): string {
  const contextStr = serializeContext(context)

  return `${contextStr}

SHIFT COMPLETED:
- Hours Worked: ${hoursWorked}
- Shift: ${context.currentShift?.title || 'Recent shift'}
- Date: ${context.currentShift?.date || 'Recently'}

Generate a thank-you email following all guidelines. Make them feel valued and appreciated.

Important considerations:
${getVolunteerThankYouGuidance(context, hoursWorked)}

Output format:
Subject: [Warm thank you subject line]

[email body - genuine gratitude and impact]`
}

function getVolunteerThankYouGuidance(
  context: VolunteerContext,
  hoursWorked: number
): string {
  const guidance: string[] = []

  if (context.volunteerHistory.totalShifts === 1) {
    guidance.push(
      '- This was their first shift - celebrate this milestone, encourage them to return'
    )
  }

  if (context.volunteerHistory.totalShifts >= 5) {
    guidance.push(
      `- Regular volunteer with ${context.volunteerHistory.totalShifts} shifts - acknowledge their loyalty and cumulative impact`
    )
  }

  if (context.volunteerHistory.totalHours >= 20) {
    guidance.push(
      `- ${context.volunteerHistory.totalHours} total hours - mention their significant time investment`
    )
  }

  if (hoursWorked >= 4) {
    guidance.push('- Long shift - acknowledge the extra commitment')
  }

  return guidance.length > 0
    ? guidance.join('\n')
    : '- Standard volunteer thank you'
}

/**
 * Get example volunteer emails for reference
 */
export function getVolunteerExamples() {
  return {
    confirmation: `Subject: Confirmed: Food Bank Shift on Saturday, Dec 7

Hi Alex,

Thank you for signing up to volunteer! We're excited to have you join us.

Your shift:
Saturday, December 7
9:00 AM - 12:00 PM
Community Food Bank, 123 Main Street

You'll be helping sort and pack food boxes for families. Please wear comfortable clothes and closed-toe shoes. We'll provide gloves and training when you arrive.

Your 3 hours will help us serve 50 families this week. Thank you for making a difference!

Questions? Reply to this email or call us at (555) 123-4567.`,

    reminder7Day: `Subject: Reminder: Food Bank Shift Next Saturday

Hi Alex,

Just a reminder - you're scheduled to volunteer next Saturday, December 7 from 9 AM to 12 PM at the Community Food Bank (123 Main Street).

We'll be sorting food donations. Wear comfortable clothes and closed-toe shoes.

Can't wait to see you there!`,

    reminder1Day: `Subject: See you tomorrow, Alex!

Hi Alex,

Quick reminder - we'll see you tomorrow (Saturday) at 9 AM at the Community Food Bank!

Address: 123 Main Street
Time: 9:00 AM - 12:00 PM

Looking forward to it!`,

    reminderMorning: `Subject: See you this morning!

Hi Alex,

This morning at 9 AM - Community Food Bank, 123 Main Street.

See you soon!`,

    thankYou: `Subject: Thank you for an amazing morning, Alex!

Hi Alex,

Thank you so much for volunteering today! Your 3 hours of work helped us pack food boxes for 50 families who will have groceries for the week because of you.

Your positive energy and hard work made such a difference. We're so grateful to have you as part of our volunteer community.

We'd love to have you back anytime. Check out our upcoming shifts at [link] whenever you're ready.

With gratitude,`,
  }
}
