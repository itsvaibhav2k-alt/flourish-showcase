'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface VoiceProfileInfo {
  hasProfile: boolean
  samplesCount: number
  voiceSummary: string | null
  trainedAt: string | null
}

export interface AISettings {
  aiEmailGeneration: boolean
  autoThankYouEmails: boolean
  autoVolunteerReminders: boolean
  autoVolunteerConfirmations: boolean
  aiNextStepSuggestions: boolean
  voiceCallsEnabled: boolean
  autoThankYouCalls: boolean
  autoReengagementCalls: boolean
  voiceShiftReminders: boolean
  voiceProfile: VoiceProfileInfo
}

/**
 * Get all AI-related settings for the current organization.
 * This includes feature toggles and voice profile status.
 */
export async function getAISettings(): Promise<AISettings> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch AI settings and voice profile data
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(
        `
        ai_email_generation,
        auto_thank_you_emails,
        auto_volunteer_reminders,
        auto_volunteer_confirmations,
        voice_summary,
        voice_samples,
        voice_trained_at,
        voice_calls_enabled,
        auto_thank_you_calls,
        auto_reengagement_calls,
        voice_shift_reminders,
        settings
      `
      )
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching AI settings:', error)
      throw new Error(error.message)
    }

    // Parse voice samples count
    const voiceSamples = organization.voice_samples || []
    const samplesCount = Array.isArray(voiceSamples) ? voiceSamples.length : 0

    // Determine if organization has a trained voice profile
    const hasProfile = Boolean(organization.voice_summary && organization.voice_trained_at)

    // Parse ai_next_step_suggestions from settings JSONB field
    // This is a NEW field stored in the settings object
    const settings = (organization.settings as Record<string, unknown>) || {}
    const aiNextStepSuggestions = Boolean(settings.ai_next_step_suggestions ?? false)

    return {
      aiEmailGeneration: organization.ai_email_generation ?? true,
      autoThankYouEmails: organization.auto_thank_you_emails ?? false,
      autoVolunteerReminders: organization.auto_volunteer_reminders ?? true,
      autoVolunteerConfirmations: organization.auto_volunteer_confirmations ?? true,
      aiNextStepSuggestions,
      voiceCallsEnabled: organization.voice_calls_enabled ?? false,
      autoThankYouCalls: organization.auto_thank_you_calls ?? false,
      autoReengagementCalls: organization.auto_reengagement_calls ?? false,
      voiceShiftReminders: organization.voice_shift_reminders ?? false,
      voiceProfile: {
        hasProfile,
        samplesCount,
        voiceSummary: organization.voice_summary,
        trainedAt: organization.voice_trained_at,
      },
    }
  } catch (error) {
    console.error('Error in getAISettings:', error)
    // Return safe defaults on error
    return {
      aiEmailGeneration: true,
      autoThankYouEmails: false,
      autoVolunteerReminders: true,
      autoVolunteerConfirmations: true,
      aiNextStepSuggestions: false,
      voiceCallsEnabled: false,
      autoThankYouCalls: false,
      autoReengagementCalls: false,
      voiceShiftReminders: false,
      voiceProfile: {
        hasProfile: false,
        samplesCount: 0,
        voiceSummary: null,
        trainedAt: null,
      },
    }
  }
}
