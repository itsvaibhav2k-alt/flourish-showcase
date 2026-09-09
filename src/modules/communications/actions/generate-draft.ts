/**
 * Generate Draft Action
 *
 * Server action to generate AI-powered email drafts for donors and volunteers.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { buildDonorContext, buildVolunteerContext } from '@/lib/ai/context/builder'
import {
  getThankYouSystemPrompt,
  getThankYouUserPrompt,
} from '@/lib/ai/prompts/thank-you'
import {
  getReengagementSystemPrompt,
  getReengagementUserPrompt,
} from '@/lib/ai/prompts/reengagement'
import {
  getVolunteerConfirmationSystemPrompt,
  getVolunteerConfirmationUserPrompt,
  getVolunteerReminderSystemPrompt,
  getVolunteerReminderUserPrompt,
  getVolunteerThankYouSystemPrompt,
  getVolunteerThankYouUserPrompt,
} from '@/lib/ai/prompts/volunteer'
import {
  getCustomEmailSystemPrompt as getAdvancedCustomEmailSystemPrompt,
  getCustomEmailUserPrompt as getAdvancedCustomEmailUserPrompt,
  getCustomEmailUserPromptVolunteer as getAdvancedCustomEmailUserPromptVolunteer,
  type CustomEmailParams,
} from '@/lib/ai/prompts/custom-email'
import { trackUsage } from '@/lib/ai/cost-tracker'
import {
  getFallbackTemplate,
  shouldUseFallback,
  logFallbackUsage,
} from '@/lib/ai/fallback'
import { getVoiceProfile } from './train-voice'

export type EmailType =
  | 'thank_you'
  | 'reengagement'
  | 'volunteer_confirmation'
  | 'volunteer_reminder'
  | 'volunteer_thank_you'
  | 'custom'          // Generic custom email (used by Flora Emails appeal)
  | 'custom_advanced' // Fully custom email with user-defined parameters
  | 'general_thanks'  // General appreciation without specific gift

// Database email_type values: 'thank_you', 'confirmation', 'reminder', 'follow_up', 'welcome', 'custom'
type DbEmailType = 'thank_you' | 'confirmation' | 'reminder' | 'follow_up' | 'welcome' | 'custom'

/**
 * Map our email types to the database schema email types
 */
function mapEmailType(emailType: EmailType): DbEmailType {
  const mapping: Record<EmailType, DbEmailType> = {
    'thank_you': 'thank_you',
    'reengagement': 'follow_up',
    'volunteer_confirmation': 'confirmation',
    'volunteer_reminder': 'reminder',
    'volunteer_thank_you': 'thank_you',
    'custom': 'custom',
    'custom_advanced': 'custom',
    'general_thanks': 'thank_you',
  }
  return mapping[emailType] || 'custom'
}

export interface GenerateDraftParams {
  organizationId: string
  contactId: string
  emailType: EmailType
  context?: {
    giftId?: string
    shiftId?: string
    reminderType?: '7-day' | '1-day' | 'morning'
    hoursWorked?: number
  }
  /** Custom email parameters for 'custom_advanced' email type */
  customParams?: {
    /** Topic/purpose of the email (required for custom_advanced) */
    topic: string
    /** Key points to include in the email */
    keyPoints?: string[]
    /** Tone preference (defaults to org voice) */
    tone?: 'warm' | 'professional' | 'casual' | 'formal' | 'spiritual' | 'urgent'
    /** Specific call-to-action to include */
    callToAction?: string
    /** Hint for subject line generation */
    subjectHint?: string
  }
  /** ID of bulk email send for batch operations */
  bulkSendId?: string
  useSonnet?: boolean // Force using Sonnet for higher quality
}

export interface GenerateDraftResult {
  success: boolean
  draftId?: string
  subject?: string
  body?: string
  error?: string
  usedFallback?: boolean
}

/**
 * Generate an email draft using Claude AI
 */
export async function generateDraft(
  params: GenerateDraftParams
): Promise<GenerateDraftResult> {
  try {
    const { organizationId, contactId, emailType, context, useSonnet } = params

    // Validate input
    if (!organizationId || !contactId || !emailType) {
      return { success: false, error: 'Missing required parameters' }
    }

    const supabase = await createClient()

    // Verify user has access
    let userId: string | null = null

    // In BYPASS_AUTH mode, skip auth checks
    if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      userId = 'demo-user'
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      userId = user.id

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        return { success: false, error: 'Access denied to this organization' }
      }
    }

    // Get voice profile (or use default if not trained)
    const voiceProfile = await getVoiceProfile(organizationId) || getDefaultVoiceProfile()

    // Generate email based on type
    let result: { subject: string; body: string; usage: any }

    try {
      result = await generateEmailByType({
        emailType,
        contactId,
        organizationId,
        voiceProfile,
        context,
        customParams: params.customParams,
        useSonnet,
      })
    } catch (error) {
      // Check if we should use fallback
      if (shouldUseFallback(error)) {
        console.warn('AI generation failed, using fallback:', error)

        // Log fallback usage
        await logFallbackUsage({
          organizationId,
          emailType,
          reason: 'AI generation failed',
          error,
        })

        // Use fallback template
        const fallbackVars = await buildFallbackVariables({
          contactId,
          organizationId,
          emailType,
          context,
        })

        const fallback = getFallbackTemplate(emailType, fallbackVars)

        // Save fallback draft
        const { data: draft, error: draftError } = await supabase
          .from('email_drafts')
          .insert({
            organization_id: organizationId,
            contact_id: contactId,
            email_type: mapEmailType(emailType),
            trigger_event: 'manual',
            trigger_event_id: context?.giftId || context?.shiftId || null,
            subject: fallback.subject,
            body: fallback.body,
            status: 'draft',
            model_used: 'fallback',
          })
          .select('id, subject, body')
          .single()

        if (draftError || !draft) {
          return { success: false, error: 'Failed to save draft' }
        }

        return {
          success: true,
          draftId: draft.id,
          subject: draft.subject,
          body: draft.body,
          usedFallback: true,
        }
      }

      throw error
    }

    // Track AI usage
    await trackUsage({
      organizationId,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheCreationInputTokens: result.usage.cacheCreationInputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
      model: result.usage.model || MODELS.HAIKU,
      emailType,
      contactId,
    })

    // Save draft to database
    const draftData: Record<string, unknown> = {
      organization_id: organizationId,
      contact_id: contactId,
      email_type: mapEmailType(emailType),
      trigger_event: emailType.includes('volunteer') ? 'shift_signup' : (emailType === 'custom_advanced' ? 'manual' : 'gift_received'),
      trigger_event_id: context?.giftId || context?.shiftId || null,
      subject: result.subject,
      body: result.body,
      status: 'draft',
      model_used: result.usage.model || MODELS.HAIKU,
    }

    // Add custom email fields if present
    if (params.customParams) {
      draftData.custom_prompt = params.customParams.topic
      draftData.custom_key_points = params.customParams.keyPoints || null
      draftData.custom_tone = params.customParams.tone || null
    }

    // Add bulk send reference if present
    if (params.bulkSendId) {
      draftData.bulk_send_id = params.bulkSendId
    }

    const { data: draft, error: draftError } = await supabase
      .from('email_drafts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(draftData as any)
      .select('id, subject, body')
      .single()

    if (draftError || !draft) {
      console.error('Failed to save draft:', draftError)
      return { success: false, error: 'Failed to save draft' }
    }

    return {
      success: true,
      draftId: draft.id,
      subject: draft.subject,
      body: draft.body,
      usedFallback: false,
    }
  } catch (error) {
    console.error('Generate draft error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate draft. Please try again.',
    }
  }
}

/**
 * Generate email based on type
 */
async function generateEmailByType(params: {
  emailType: EmailType
  contactId: string
  organizationId: string
  voiceProfile: any
  context?: GenerateDraftParams['context']
  customParams?: GenerateDraftParams['customParams']
  useSonnet?: boolean
}): Promise<{ subject: string; body: string; usage: any }> {
  const { emailType, contactId, voiceProfile, context, customParams, useSonnet } = params

  let systemPrompt: string
  let userPrompt: string
  const model = MODELS.HAIKU // Always use Haiku for cost efficiency

  switch (emailType) {
    case 'thank_you': {
      const donorContext = await buildDonorContext(contactId)

      if (context?.giftId) {
        // Thank-you for specific gift
        const supabase = await createClient()
        const { data: gift } = await supabase
          .from('gifts')
          .select('*')
          .eq('id', context.giftId)
          .single()

        if (!gift) {
          throw new Error('Gift not found')
        }

        systemPrompt = getThankYouSystemPrompt(voiceProfile)
        userPrompt = getThankYouUserPrompt(donorContext, {
          amount: gift.amount,
          date: gift.gift_date,
          campaign: gift.campaign,
          giftType: gift.gift_type,
          paymentMethod: gift.payment_method,
        })
      } else {
        // General thank-you based on overall history (no specific gift)
        systemPrompt = getGeneralThankYouSystemPrompt(voiceProfile)
        userPrompt = getGeneralThankYouUserPrompt(donorContext)
      }

      break
    }

    case 'general_thanks': {
      const donorContext = await buildDonorContext(contactId)
      systemPrompt = getGeneralThankYouSystemPrompt(voiceProfile)
      userPrompt = getGeneralThankYouUserPrompt(donorContext)
      break
    }

    case 'custom': {
      // Custom/appeal email - general fundraising or communication
      const donorContext = await buildDonorContext(contactId)
      systemPrompt = getCustomEmailSystemPrompt(voiceProfile)
      userPrompt = getCustomEmailUserPrompt(donorContext)
      break
    }

    case 'reengagement': {
      const donorContext = await buildDonorContext(contactId)

      // Calculate months since last gift
      const lastGiftDate = donorContext.giving.lastGiftDate
        ? new Date(donorContext.giving.lastGiftDate)
        : new Date()
      const monthsSince = Math.floor(
        (Date.now() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      systemPrompt = getReengagementSystemPrompt(voiceProfile)
      userPrompt = getReengagementUserPrompt(donorContext, monthsSince)

      break
    }

    case 'volunteer_confirmation': {
      if (!context?.shiftId) {
        throw new Error('Shift ID required for volunteer confirmation')
      }

      const volunteerContext = await buildVolunteerContext(
        contactId,
        context.shiftId
      )

      systemPrompt = getVolunteerConfirmationSystemPrompt(voiceProfile)
      userPrompt = getVolunteerConfirmationUserPrompt(volunteerContext)

      break
    }

    case 'volunteer_reminder': {
      if (!context?.shiftId || !context?.reminderType) {
        throw new Error('Shift ID and reminder type required for reminders')
      }

      const volunteerContext = await buildVolunteerContext(
        contactId,
        context.shiftId
      )

      systemPrompt = getVolunteerReminderSystemPrompt(
        voiceProfile,
        context.reminderType
      )
      userPrompt = getVolunteerReminderUserPrompt(
        volunteerContext,
        context.reminderType
      )

      break
    }

    case 'volunteer_thank_you': {
      const volunteerContext = await buildVolunteerContext(
        contactId,
        context?.shiftId
      )

      systemPrompt = getVolunteerThankYouSystemPrompt(voiceProfile)
      userPrompt = getVolunteerThankYouUserPrompt(
        volunteerContext,
        context?.hoursWorked || 3
      )

      break
    }

    case 'custom_advanced': {
      // Fully custom email with user-defined parameters
      if (!customParams?.topic) {
        throw new Error('Topic is required for custom_advanced email type')
      }

      // Check if this is a volunteer-focused email based on context
      const isVolunteerEmail = context?.shiftId !== undefined

      if (isVolunteerEmail) {
        const volunteerContext = await buildVolunteerContext(
          contactId,
          context?.shiftId
        )
        systemPrompt = getAdvancedCustomEmailSystemPrompt(voiceProfile, customParams)
        userPrompt = getAdvancedCustomEmailUserPromptVolunteer(volunteerContext, customParams)
      } else {
        const donorContext = await buildDonorContext(contactId)
        systemPrompt = getAdvancedCustomEmailSystemPrompt(voiceProfile, customParams)
        userPrompt = getAdvancedCustomEmailUserPrompt(donorContext, customParams)
      }

      break
    }

    default:
      throw new Error(`Unknown email type: ${emailType}`)
  }

  // Generate with Claude
  const response = await generateWithCaching({
    systemPrompt,
    userPrompt,
    model,
    maxTokens: 1024,
  })

  // Parse subject and body
  const parsed = parseEmailResponse(response.content)

  return {
    subject: parsed.subject,
    body: parsed.body,
    usage: {
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
    },
  }
}

/**
 * Parse email response from Claude
 */
function parseEmailResponse(content: string): {
  subject: string
  body: string
} {
  // Look for "Subject:" line
  const subjectMatch = content.match(/Subject:\s*(.+)/i)
  const subject = subjectMatch ? subjectMatch[1].trim() : 'Your Email'

  // Get body (everything after subject line)
  let body = content
  if (subjectMatch) {
    body = content
      .substring(content.indexOf(subjectMatch[0]) + subjectMatch[0].length)
      .trim()
  }

  return { subject, body }
}

/**
 * Build fallback template variables
 */
async function buildFallbackVariables(params: {
  contactId: string
  organizationId: string
  emailType: EmailType
  context?: GenerateDraftParams['context']
}): Promise<Record<string, string>> {
  const supabase = await createClient()

  // Get contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.contactId)
    .single()

  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', params.organizationId)
    .single()

  const vars: Record<string, string> = {
    firstName: contact?.first_name || 'Friend',
    organizationName: org?.name || 'Our Organization',
  }

  // Add type-specific variables
  if (params.emailType === 'thank_you' && params.context?.giftId) {
    const { data: gift } = await supabase
      .from('gifts')
      .select('amount')
      .eq('id', params.context.giftId)
      .single()

    vars.amount = gift ? `$${gift.amount.toFixed(2)}` : '$0.00'
  }

  if (
    params.emailType.startsWith('volunteer') &&
    params.context?.shiftId
  ) {
    const { data: shift } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', params.context.shiftId)
      .single()

    if (shift) {
      vars.shiftTitle = shift.title
      vars.shiftDate = new Date(shift.start_time).toLocaleDateString()
      vars.shiftTime = `${new Date(shift.start_time).toLocaleTimeString()} - ${new Date(shift.end_time).toLocaleTimeString()}`
      vars.shiftLocation = shift.location || 'TBD'
    }
  }

  if (params.emailType === 'volunteer_reminder') {
    vars.reminderTiming =
      params.context?.reminderType === '7-day'
        ? 'next week'
        : params.context?.reminderType === '1-day'
          ? 'tomorrow'
          : 'today'
  }

  if (params.emailType === 'volunteer_thank_you') {
    vars.hoursWorked = String(params.context?.hoursWorked || 3)
  }

  return vars
}

/**
 * Get default voice profile for organizations without trained voice
 * This provides a warm, professional nonprofit tone
 */
function getDefaultVoiceProfile() {
  return {
    voiceSummary: 'Warm, heartfelt, and genuine nonprofit communication style. Professional yet personal, focusing on gratitude and community impact.',
    formality: 'semi-formal',
    warmth: 8,
    signaturePhrases: [
      'Thank you for being part of our community',
      'Your generosity makes a real difference',
      'Together, we can achieve so much more',
    ],
    greetingStyle: 'Dear [First Name],',
    closingStyle: 'With gratitude,',
    toneCharacteristics: [
      'heartfelt',
      'appreciative',
      'community-focused',
      'impact-driven',
      'personal',
    ],
  }
}

/**
 * System prompt for general thank-you emails (without specific gift)
 */
function getGeneralThankYouSystemPrompt(voiceProfile: any): string {
  return `You are an expert nonprofit fundraising professional writing donor appreciation emails.

VOICE PROFILE:
${voiceProfile.voiceSummary}
- Formality: ${voiceProfile.formality}
- Warmth level: ${voiceProfile.warmth}/10
- Tone: ${voiceProfile.toneCharacteristics?.join(', ') || 'warm, appreciative'}

YOUR TASK:
Write a personalized appreciation email that thanks the donor for their overall support and engagement with the organization.

EMAIL REQUIREMENTS:
- Length: 100-200 words
- Structure:
  1. Personal greeting using their first name
  2. Express gratitude for their support
  3. Highlight their impact (use their giving history if available)
  4. Forward-looking statement about continuing the partnership
  5. Warm closing

CRITICAL RULES:
- Make it feel genuine and personal, NOT templated
- Focus on IMPACT over transactions
- Reference their history/relationship when available
- Keep paragraphs short (2-3 sentences max)
- No asking for donations in an appreciation email
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [subject line]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

/**
 * User prompt for general thank-you emails
 */
function getGeneralThankYouUserPrompt(context: any): string {
  const hasGivingHistory = context.giving?.totalGifts > 0

  return `DONOR INFORMATION:
- Name: ${context.donor?.firstName || 'Friend'} ${context.donor?.lastName || ''}
${hasGivingHistory ? `
GIVING HISTORY:
- Total Gifts: ${context.giving.totalGifts}
- Total Given: $${context.giving.totalGiven?.toFixed(2) || '0.00'}
- Average Gift: $${context.giving.avgGift?.toFixed(2) || '0.00'}
- First Gift: ${context.giving.firstGiftDate || 'Unknown'}
- Last Gift: ${context.giving.lastGiftDate || 'Unknown'}
` : '- No giving history yet'}

RELATIONSHIP:
- Segment: ${context.relationship?.segment || 'New Contact'}
- Years of Support: ${context.relationship?.yearsOfSupport || 0}
- Engagement Score: ${context.relationship?.engagementScore || 0}/100

Generate a heartfelt appreciation email for this donor based on their relationship with our organization.`
}

/**
 * System prompt for custom/appeal emails
 */
function getCustomEmailSystemPrompt(voiceProfile: any): string {
  return `You are an expert nonprofit fundraising professional writing donor communication emails.

VOICE PROFILE:
${voiceProfile.voiceSummary}
- Formality: ${voiceProfile.formality}
- Warmth level: ${voiceProfile.warmth}/10
- Tone: ${voiceProfile.toneCharacteristics?.join(', ') || 'warm, professional'}

YOUR TASK:
Write a personalized email that engages the donor and strengthens their connection to the organization's mission.

EMAIL REQUIREMENTS:
- Length: 150-250 words
- Structure:
  1. Personal greeting using their first name
  2. Connect with them personally
  3. Share something meaningful about the organization's work
  4. Include a soft call-to-action (visit website, share story, etc.)
  5. Warm closing

CRITICAL RULES:
- Make it feel genuine and personal
- Focus on storytelling and impact
- Reference their relationship when available
- Keep paragraphs short
- Match the organization's voice exactly

OUTPUT FORMAT:
Subject: [engaging subject line]

[email body]

Do NOT include sender name/signature - that will be added automatically.`
}

/**
 * User prompt for custom/appeal emails
 */
function getCustomEmailUserPrompt(context: any): string {
  return `RECIPIENT INFORMATION:
- Name: ${context.donor?.firstName || 'Friend'} ${context.donor?.lastName || ''}

${context.giving?.totalGifts > 0 ? `
GIVING HISTORY:
- Total Gifts: ${context.giving.totalGifts}
- Total Given: $${context.giving.totalGiven?.toFixed(2) || '0.00'}
- Last Gift: ${context.giving.lastGiftDate || 'Unknown'}
` : '- New contact or non-donor'}

RELATIONSHIP:
- Segment: ${context.relationship?.segment || 'New Contact'}
- Engagement Score: ${context.relationship?.engagementScore || 0}/100

Generate an engaging email that strengthens this person's connection to our organization.`
}
