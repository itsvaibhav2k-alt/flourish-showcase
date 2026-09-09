/**
 * Fallback Email Templates
 *
 * Provides fallback templates when AI generation fails or is unavailable.
 * These ensure communications can continue even if Claude API is down.
 */

export type EmailType =
  | 'thank_you'
  | 'reengagement'
  | 'volunteer_confirmation'
  | 'volunteer_reminder'
  | 'volunteer_thank_you'
  | 'custom'
  | 'custom_advanced'
  | 'general_thanks'

export interface FallbackTemplate {
  subject: string
  body: string
}

/**
 * Get fallback template for a given email type
 */
export function getFallbackTemplate(
  type: EmailType,
  variables?: Record<string, string>
): FallbackTemplate {
  const template = FALLBACK_TEMPLATES[type]

  if (!template) {
    throw new Error(`No fallback template found for type: ${type}`)
  }

  // Replace variables if provided
  let subject = template.subject
  let body = template.body

  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
      body = body.replace(new RegExp(placeholder, 'g'), value)
    })
  }

  return { subject, body }
}

/**
 * Fallback templates for each email type
 */
const FALLBACK_TEMPLATES: Record<EmailType, FallbackTemplate> = {
  thank_you: {
    subject: 'Thank you for your generous gift',
    body: `Dear {{firstName}},

Thank you so much for your generous gift of {{amount}}. Your support makes a real difference in the work we do.

Because of donors like you, we're able to continue serving our community and making an impact. We're deeply grateful for your partnership.

If you have any questions about your gift or our work, please don't hesitate to reach out.

With gratitude,

{{organizationName}}`,
  },

  reengagement: {
    subject: "We've missed you",
    body: `Dear {{firstName}},

I wanted to reach out personally to say hello and share some updates about our work.

It's been a while since your last gift, and we wanted you to know that your previous support made a real impact. We're grateful for the difference you've made.

We'd love to have you back as part of our community, but we understand priorities change. Either way, thank you for your past support.

If you'd like to stay connected or learn more about what we're doing, we'd be happy to share more.

Best regards,

{{organizationName}}`,
  },

  volunteer_confirmation: {
    subject: 'Volunteer Shift Confirmed - {{shiftTitle}}',
    body: `Dear {{firstName}},

Thank you for signing up to volunteer! We're excited to have you join us.

SHIFT DETAILS:
- Date: {{shiftDate}}
- Time: {{shiftTime}}
- Location: {{shiftLocation}}
- Activity: {{shiftTitle}}

Please arrive on time and ready to help. If you have any questions before your shift, feel free to reach out.

Thank you for giving your time to make a difference!

Best regards,

{{organizationName}}`,
  },

  volunteer_reminder: {
    subject: 'Reminder: Volunteer Shift {{reminderTiming}}',
    body: `Hi {{firstName}},

Just a friendly reminder about your upcoming volunteer shift:

{{shiftTitle}}
{{shiftDate}} at {{shiftTime}}
{{shiftLocation}}

We're looking forward to seeing you!

If you need to cancel or have any questions, please let us know as soon as possible.

See you soon,

{{organizationName}}`,
  },

  volunteer_thank_you: {
    subject: 'Thank you for volunteering!',
    body: `Dear {{firstName}},

Thank you so much for volunteering with us! Your {{hoursWorked}} hours of service made a real difference.

We're grateful for volunteers like you who give their time to support our mission. Your contribution helps us serve our community better.

We'd love to have you volunteer again whenever you're available. Check our volunteer calendar for upcoming opportunities.

With appreciation,

{{organizationName}}`,
  },

  custom: {
    subject: 'A message from {{organizationName}}',
    body: `Dear {{firstName}},

We wanted to reach out and share an update with you.

Your continued support and involvement mean so much to us. We're grateful for the difference you help us make in our community.

Please feel free to reach out if you have any questions or would like to learn more about our work.

Best regards,

{{organizationName}}`,
  },

  custom_advanced: {
    subject: 'A message from {{organizationName}}',
    body: `Dear {{firstName}},

We wanted to reach out and share an update with you.

Your continued support and involvement mean so much to us. We're grateful for the difference you help us make in our community.

Please feel free to reach out if you have any questions or would like to learn more about our work.

Best regards,

{{organizationName}}`,
  },

  general_thanks: {
    subject: 'Thank you for your support',
    body: `Dear {{firstName}},

We wanted to take a moment to thank you for your support of our organization.

Your involvement and generosity help us continue our mission and make a real difference in our community. We're truly grateful for supporters like you.

If you have any questions or would like to learn more about our work, please don't hesitate to reach out.

With gratitude,

{{organizationName}}`,
  },
}

/**
 * Check if fallback should be used based on error type
 */
export function shouldUseFallback(error: unknown): boolean {
  if (!error) return false

  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Use fallback for API errors, rate limits, or service unavailable
  const fallbackTriggers = [
    'api error',
    'rate limit',
    'service unavailable',
    'timeout',
    'network error',
    'connection',
    'claude api',
    'anthropic',
  ]

  return fallbackTriggers.some(trigger => errorMessage.includes(trigger))
}

/**
 * Log fallback usage for monitoring
 */
export async function logFallbackUsage(params: {
  organizationId: string
  emailType: EmailType
  reason: string
  error?: unknown
}): Promise<void> {
  const { organizationId, emailType, reason, error } = params

  // In a production app, you'd want to log this to your database or monitoring service
  console.warn('AI fallback used:', {
    organizationId,
    emailType,
    reason,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  })

  // You could also increment a counter in your database:
  // await supabase.from('ai_fallbacks').insert({ ... })
}

/**
 * Get a human-readable explanation for why fallback was used
 */
export function getFallbackReason(error: unknown): string {
  if (!error) return 'Unknown error'

  const errorMessage =
    error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('rate limit')) {
    return 'AI service rate limit reached. Using standard template.'
  }

  if (errorMessage.includes('timeout')) {
    return 'AI service timeout. Using standard template.'
  }

  if (errorMessage.includes('api') || errorMessage.includes('service')) {
    return 'AI service temporarily unavailable. Using standard template.'
  }

  return 'AI generation failed. Using standard template.'
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
  type: EmailType,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredVariables = getRequiredVariables(type)
  const missing = requiredVariables.filter(v => !variables[v])

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Get required variables for a template type
 */
function getRequiredVariables(type: EmailType): string[] {
  const baseVariables = ['firstName', 'organizationName']

  const typeSpecific: Record<EmailType, string[]> = {
    thank_you: ['amount'],
    reengagement: [],
    volunteer_confirmation: [
      'shiftTitle',
      'shiftDate',
      'shiftTime',
      'shiftLocation',
    ],
    volunteer_reminder: [
      'shiftTitle',
      'shiftDate',
      'shiftTime',
      'shiftLocation',
      'reminderTiming',
    ],
    volunteer_thank_you: ['hoursWorked'],
    custom: [],
    custom_advanced: [],
    general_thanks: [],
  }

  return [...baseVariables, ...(typeSpecific[type] || [])]
}
