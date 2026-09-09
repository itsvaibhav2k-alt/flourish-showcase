/**
 * Email Enhancement Prompts
 *
 * Prompts for enhancing user-written emails with AI while
 * maintaining their original voice and intent.
 */

import { VoiceProfile, getVoiceInstructions } from './voice-analysis'

export type EnhancementMode = 'polish' | 'expand' | 'personalize'

/**
 * Get enhancement mode description
 */
function getEnhancementModeDescription(mode: EnhancementMode): string {
  const modes: Record<EnhancementMode, string> = {
    polish: `POLISH MODE - Light touch enhancement:
- Fix any grammar, spelling, or punctuation errors
- Improve sentence flow and readability
- Maintain the user's original voice and tone
- Keep the same length (within 10%)
- Do NOT add new content or ideas
- Do NOT change the core message`,

    expand: `EXPAND MODE - Add depth and detail:
- Keep the user's core message and structure
- Add relevant details and context
- Expand on key points for greater impact
- Improve transitions between paragraphs
- May increase length by 30-50%
- Maintain the user's voice while enriching content`,

    personalize: `PERSONALIZE MODE - Add recipient-specific content:
- Reference the recipient's history with the organization
- Include specific details about their contributions or involvement
- Make the email feel individually crafted for them
- Add relevant context from their relationship
- Keep the user's core message intact
- Enhance emotional connection`,
  }
  return modes[mode]
}

/**
 * Get the system prompt for email enhancement
 */
export function getEnhanceEmailSystemPrompt(
  voiceProfile: VoiceProfile,
  mode: EnhancementMode
): string {
  return `You are an expert email editor helping a nonprofit organization enhance their communications.

${getVoiceInstructions(voiceProfile)}

${getEnhancementModeDescription(mode)}

IMPORTANT RULES:
1. Preserve the user's intent and key message
2. Never change facts, names, dates, or specific details
3. Match the formality level of the original
4. Keep the same greeting and closing style unless clearly wrong
5. Output ONLY the enhanced email, no explanations

OUTPUT FORMAT:
Subject: [enhanced subject line]

[enhanced email body]

Do not include any preamble, commentary, or explanation. Just output the enhanced email.`
}

/**
 * Get the user prompt for email enhancement
 */
export function getEnhanceEmailUserPrompt(params: {
  userSubject: string
  userBody: string
  recipientContext: string
  enhancementMode: EnhancementMode
}): string {
  const { userSubject, userBody, recipientContext, enhancementMode } = params

  let contextSection = ''
  if (enhancementMode === 'personalize') {
    contextSection = `
RECIPIENT CONTEXT (use this to personalize):
${recipientContext}

Use relevant details from the recipient's history to make this email feel personally crafted for them.
`
  }

  return `Please enhance this email using ${enhancementMode.toUpperCase()} mode:

ORIGINAL SUBJECT:
${userSubject}

ORIGINAL BODY:
${userBody}
${contextSection}
Remember: Output ONLY the enhanced email with Subject: line followed by the body. No explanations.`
}

/**
 * Prompts for quick actions (used in UI)
 */
export const QUICK_ENHANCEMENT_PROMPTS = {
  fixGrammar: 'Fix grammar and spelling while preserving the original message exactly.',
  improveClarity: 'Improve clarity and readability. Make sentences flow better.',
  addWarmth: 'Add warmth and a more personal touch while keeping the message.',
  makeUrgent: 'Add appropriate urgency without being pushy.',
  shortenText: 'Make this more concise while keeping all key points.',
} as const

export type QuickEnhancement = keyof typeof QUICK_ENHANCEMENT_PROMPTS
