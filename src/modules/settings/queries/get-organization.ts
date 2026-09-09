'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Organization, EmailSettings, VoiceProfile, Snippet } from '../schemas/organization'

export type OrganizationSettings = Omit<Organization, 'settings'> & {
  settings?: Record<string, unknown>
  emailSettings?: EmailSettings
  tone_preset?: 'warm' | 'professional' | 'casual' | 'formal' | null
  snippets?: Snippet[] | null
}

/**
 * Get the current organization's settings.
 * Returns the organization data including email settings and voice profile.
 */
export async function getOrganization(): Promise<OrganizationSettings | null> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      if (orgError.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Error fetching organization:', orgError)
      throw new Error(orgError.message)
    }

    // Parse email settings from the settings JSONB field
    const emailSettings = (organization.settings as Record<string, unknown>) || {}

    const result: OrganizationSettings = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      public_slug: organization.public_slug || undefined,
      created_at: organization.created_at,
      settings: organization.settings as Record<string, unknown> | undefined,
      voice_samples: organization.voice_samples || undefined,
      voice_summary: organization.voice_summary || undefined,
      voice_formality: (organization.voice_formality as 'casual' | 'moderate' | 'formal' | null) || undefined,
      voice_warmth: organization.voice_warmth || undefined,
      voice_signature_phrases: organization.voice_signature_phrases || undefined,
      voice_greeting_style: organization.voice_greeting_style || undefined,
      voice_closing_style: organization.voice_closing_style || undefined,
      voice_tone_characteristics: organization.voice_tone_characteristics || undefined,
      voice_trained_at: organization.voice_trained_at || undefined,
      voice_trained_by: organization.voice_trained_by || undefined,
      tone_preset: (organization.tone_preset as 'warm' | 'professional' | 'casual' | 'formal' | null) || null,
      snippets: (organization.snippets as Snippet[] | null) || null,
      ein: (organization as Record<string, unknown>).ein as string | null || null,
      tax_exempt_status: (organization as Record<string, unknown>).tax_exempt_status as string | null || null,
      tax_receipt_footer: (organization as Record<string, unknown>).tax_receipt_footer as string | null || null,
      emailSettings: {
        email_from: emailSettings.email_from as string | undefined,
        email_signature: emailSettings.email_signature as string | undefined,
        auto_send_confirmations: emailSettings.auto_send_confirmations as boolean | undefined,
        auto_send_reminders: emailSettings.auto_send_reminders as boolean | undefined,
        review_thank_you: emailSettings.review_thank_you as boolean | undefined,
        review_reengagement: emailSettings.review_reengagement as boolean | undefined,
        reminder_hours_before: emailSettings.reminder_hours_before as number | undefined,
      },
    }

    return result
  } catch (error) {
    console.error('Error in getOrganization:', error)
    throw error
  }
}

/**
 * Get the voice profile information for the current organization.
 */
export async function getVoiceProfile(): Promise<VoiceProfile | null> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch voice profile data
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('voice_summary, voice_formality, voice_warmth, voice_signature_phrases, voice_greeting_style, voice_closing_style, voice_tone_characteristics, voice_trained_at, voice_trained_by, voice_samples')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching voice profile:', error)
      throw new Error(error.message)
    }

    return {
      voice_summary: organization.voice_summary,
      voice_formality: organization.voice_formality as 'casual' | 'moderate' | 'formal' | null,
      voice_warmth: organization.voice_warmth,
      voice_signature_phrases: organization.voice_signature_phrases,
      voice_greeting_style: organization.voice_greeting_style,
      voice_closing_style: organization.voice_closing_style,
      voice_tone_characteristics: organization.voice_tone_characteristics,
      voice_trained_at: organization.voice_trained_at,
      voice_trained_by: organization.voice_trained_by,
    }
  } catch (error) {
    console.error('Error in getVoiceProfile:', error)
    throw error
  }
}

/**
 * Get the count of voice training samples for the current organization.
 */
export async function getVoiceSamplesCount(): Promise<number> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch voice samples array
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('voice_samples')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching voice samples count:', error)
      throw new Error(error.message)
    }

    return organization.voice_samples?.length || 0
  } catch (error) {
    console.error('Error in getVoiceSamplesCount:', error)
    return 0
  }
}
