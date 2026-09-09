/**
 * Flora Tooltips
 *
 * Centralized tooltip content for the Flora mascot.
 * Flora is Flourish's friendly AI assistant that helps explain AI features.
 */

export interface FloraTooltip {
  /** Short feature name */
  title: string
  /** What the feature does (1-2 sentences) */
  content: string
  /** Pro tip or recommendation (optional) */
  tip?: string
}

export type FloraTooltipKey =
  | 'aiEmailGeneration'
  | 'thankYouEmails'
  | 'reengagementEmails'
  | 'volunteerEmails'
  | 'voiceProfile'
  | 'nextStepSuggestions'
  | 'costTracking'

/**
 * Flora's tooltip content for each AI feature.
 * Written in Flora's friendly, first-person voice.
 */
export const floraTooltips: Record<FloraTooltipKey, FloraTooltip> = {
  aiEmailGeneration: {
    title: 'AI Email Generation',
    content:
      "When enabled, I'll help craft personalized emails based on your organization's voice profile. Each email is tailored to the recipient's history and relationship with your nonprofit.",
    tip: "This is the master switch - turning it off disables all AI email features below. You can still use manual templates.",
  },

  thankYouEmails: {
    title: 'Thank-You Emails',
    content:
      "I'll automatically generate heartfelt thank-you emails when donors make gifts. Each message references their specific contribution and giving history to make it personal.",
    tip: 'Works best when your voice profile is trained. Emails go to your drafts for review before sending.',
  },

  reengagementEmails: {
    title: 'Re-engagement Emails',
    content:
      "I'll help you reconnect with lapsed donors by crafting personalized messages that acknowledge their past support and invite them back. I consider their giving patterns to find the right tone.",
    tip: 'I identify at-risk donors automatically based on their typical giving frequency. Check your Lapse Risk dashboard to see who might need outreach.',
  },

  volunteerEmails: {
    title: 'Volunteer Emails',
    content:
      "I handle the full volunteer communication cycle - confirmation emails when they sign up, friendly reminders before their shift, and thank-you messages after they serve.",
    tip: 'Reminder timing is configurable in your settings. I include shift details, location, and any special instructions you provide.',
  },

  voiceProfile: {
    title: 'Voice Profile',
    content:
      "I learn your organization's unique writing style by analyzing sample emails you provide. This helps me match your tone, vocabulary, and personality in every email I generate.",
    tip: 'The more samples you provide, the better I get. Include a variety of email types for best results - thank-yous, updates, and appeals.',
  },

  nextStepSuggestions: {
    title: 'Next Step Suggestions',
    content:
      "Based on each contact's history and engagement patterns, I'll suggest the most impactful next action you could take. Whether it's a follow-up call, a thank-you note, or an event invitation.",
    tip: "I consider factors like recent donations, volunteer activity, communication history, and time since last contact to make relevant suggestions.",
  },

  costTracking: {
    title: 'Usage & Cost Tracking',
    content:
      'I keep detailed records of AI usage so you can monitor costs and understand how the AI features are being used across your organization.',
    tip: 'You can set monthly spending limits in your settings. I use efficient caching to minimize costs while maintaining quality.',
  },
}

/**
 * Get tooltip content for a specific feature
 */
export function getFloraTooltip(key: FloraTooltipKey): FloraTooltip {
  return floraTooltips[key]
}

/**
 * Get all tooltip keys for iteration
 */
export function getFloraTooltipKeys(): FloraTooltipKey[] {
  return Object.keys(floraTooltips) as FloraTooltipKey[]
}

/**
 * Check if a key is a valid Flora tooltip key
 */
export function isFloraTooltipKey(key: string): key is FloraTooltipKey {
  return key in floraTooltips
}
