/**
 * Enhance Email Action
 *
 * Takes user-written email content and enhances it with AI,
 * personalizing to the recipient and matching organization voice.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { generateWithCaching } from '@/lib/ai/claude'
import { getVoiceProfile } from '@/modules/settings'
import { buildDonorContext, buildVolunteerContext } from '@/lib/ai/context/builder'
import {
  getEnhanceEmailSystemPrompt,
  getEnhanceEmailUserPrompt,
  type EnhancementMode,
} from '@/lib/ai/prompts/enhance-email'

export interface EnhanceEmailParams {
  organizationId: string
  contactId: string
  userSubject: string
  userBody: string
  enhancementMode: EnhancementMode
}

export interface EnhanceEmailResult {
  success: boolean
  subject?: string
  body?: string
  error?: string
}

/**
 * Enhance a user-written email with AI
 *
 * Modes:
 * - polish: Light touch - fix grammar, improve flow, keep original voice
 * - expand: Add detail and depth while maintaining message
 * - personalize: Add recipient-specific content based on their history
 */
export async function enhanceEmail(
  params: EnhanceEmailParams
): Promise<EnhanceEmailResult> {
  try {
    const currentOrgId = await getCurrentOrganizationId()
    if (!currentOrgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { organizationId, contactId, userSubject, userBody, enhancementMode } = params

    if (!userSubject.trim() || !userBody.trim()) {
      return { success: false, error: 'Subject and body are required' }
    }

    const supabase = await createClient()

    // Get organization voice profile (uses session context)
    const voiceProfile = await getVoiceProfile()

    // Get contact info - filter by current organization for RLS
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, gifts(*)')
      .eq('id', contactId)
      .eq('organization_id', currentOrgId)
      .single()

    if (contactError || !contact) {
      console.error('Contact lookup failed:', contactError?.message || 'Contact not found', { contactId, currentOrgId })
      return { success: false, error: 'Contact not found' }
    }

    // Check if contact is a volunteer separately (different table structure)
    const { data: volunteerData } = await supabase
      .from('volunteer_signups')
      .select('id')
      .eq('contact_id', contactId)
      .limit(1)

    // Build context based on contact type
    const isDonor = contact.gifts && contact.gifts.length > 0
    const isVolunteer = volunteerData && volunteerData.length > 0

    let recipientContext: string
    if (isDonor) {
      const donorContext = await buildDonorContext(contactId)
      recipientContext = JSON.stringify(donorContext, null, 2)
    } else if (isVolunteer) {
      const volunteerContext = await buildVolunteerContext(contactId)
      recipientContext = JSON.stringify(volunteerContext, null, 2)
    } else {
      // Basic contact context
      recipientContext = JSON.stringify({
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        relationship: 'contact',
      }, null, 2)
    }

    // Generate enhanced email
    const systemPrompt = getEnhanceEmailSystemPrompt(voiceProfile, enhancementMode)
    const userPrompt = getEnhanceEmailUserPrompt({
      userSubject,
      userBody,
      recipientContext,
      enhancementMode,
    })

    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
    })

    // Parse response
    const parsed = parseEnhancedEmailResponse(response.content)

    return {
      success: true,
      subject: parsed.subject,
      body: parsed.body,
    }
  } catch (error) {
    console.error('Enhance email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance email',
    }
  }
}

/**
 * Parse the enhanced email response from Claude
 */
function parseEnhancedEmailResponse(content: string): {
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

  // Clean up any markdown formatting
  body = body.replace(/^---+\s*$/gm, '').trim()

  return { subject, body }
}

/**
 * Save an enhanced email as a draft
 */
export async function saveEnhancedDraft(params: {
  organizationId: string
  contactId: string
  subject: string
  body: string
}): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const currentOrgId = await getCurrentOrganizationId()
    if (!currentOrgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_drafts')
      .insert({
        organization_id: currentOrgId,
        contact_id: params.contactId,
        email_type: 'custom',
        subject: params.subject,
        body: params.body,
        status: 'draft',
        trigger_event: 'manual',
      })
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('Failed to save draft')
    }

    return { success: true, draftId: data.id }
  } catch (error) {
    console.error('Save enhanced draft error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft',
    }
  }
}
