/**
 * Train Voice Action
 *
 * Server action to train organizational voice from email samples.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { analyzeVoiceSamples } from '@/lib/ai/claude'
import { revalidatePath } from 'next/cache'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface TrainVoiceResult {
  success: boolean
  error?: string
  voiceProfile?: {
    voiceSummary: string
    formality: string
    warmth: number
    signaturePhrases: string[]
    greetingStyle: string
    closingStyle: string
    toneCharacteristics: string[]
  }
}

/**
 * Train organizational voice from email samples stored in the organization
 *
 * Requires 5-15 sample emails that represent the organization's
 * typical communication style.
 */
export async function trainVoice(): Promise<TrainVoiceResult> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    // Get voice samples from organization
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('voice_samples')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Failed to fetch organization data' }
    }

    const voiceSamples = org?.voice_samples || []

    // Validate we have enough samples
    if (voiceSamples.length < 5) {
      return {
        success: false,
        error: 'At least 5 email samples are required for voice training',
      }
    }

    // Parse and extract content from samples
    const emailSamples: string[] = []
    for (const sample of voiceSamples) {
      try {
        const parsed = JSON.parse(sample)
        if (parsed.content && parsed.content.trim().length >= 50) {
          emailSamples.push(parsed.content.trim())
        }
      } catch {
        // If parsing fails, treat as plain text
        if (sample && sample.trim().length >= 50) {
          emailSamples.push(sample.trim())
        }
      }
    }

    if (emailSamples.length < 5) {
      return {
        success: false,
        error: 'At least 5 valid email samples are required for voice training',
      }
    }

    // Verify user has access to this organization
    let userId: string | null = null

    // In BYPASS_AUTH mode, skip auth checks but still need a user ID for tracking
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
        return {
          success: false,
          error: 'Access denied to this organization',
        }
      }

      // Only admins can train voice
      if (membership.role !== 'admin') {
        return {
          success: false,
          error: 'Only organization admins can train voice',
        }
      }
    }

    // Analyze voice samples using Claude
    const voiceAnalysis = await analyzeVoiceSamples(emailSamples)

    // Save voice profile to organization
    // Note: voice_trained_by requires a valid UUID, so we only set it when we have a real user
    const updateData: Record<string, unknown> = {
      voice_summary: voiceAnalysis.voiceSummary,
      voice_formality: voiceAnalysis.formality,
      voice_warmth: voiceAnalysis.warmth,
      voice_signature_phrases: voiceAnalysis.signaturePhrases,
      voice_greeting_style: voiceAnalysis.greetingStyle,
      voice_closing_style: voiceAnalysis.closingStyle,
      voice_tone_characteristics: voiceAnalysis.toneCharacteristics,
      voice_trained_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Only set voice_trained_by if we have a valid UUID (not in BYPASS_AUTH mode)
    if ((process.env.BYPASS_AUTH !== 'true' || process.env.NODE_ENV === 'production') && userId && userId !== 'demo-user') {
      updateData.voice_trained_by = userId
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (updateError) {
      console.error('Failed to save voice profile:', updateError)
      return {
        success: false,
        error: 'Failed to save voice profile',
      }
    }

    // Revalidate any cached organization data
    revalidatePath('/settings')
    revalidatePath('/communications')

    return {
      success: true,
      voiceProfile: {
        voiceSummary: voiceAnalysis.voiceSummary,
        formality: voiceAnalysis.formality,
        warmth: voiceAnalysis.warmth,
        signaturePhrases: voiceAnalysis.signaturePhrases,
        greetingStyle: voiceAnalysis.greetingStyle,
        closingStyle: voiceAnalysis.closingStyle,
        toneCharacteristics: voiceAnalysis.toneCharacteristics,
      },
    }
  } catch (error) {
    console.error('Voice training error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to train voice. Please try again.',
    }
  }
}

/**
 * Get current voice profile for an organization
 */
export async function getVoiceProfile(organizationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select(
      'voice_summary, voice_formality, voice_warmth, voice_signature_phrases, voice_greeting_style, voice_closing_style, voice_tone_characteristics, voice_trained_at'
    )
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    return null
  }

  // Check if voice is trained
  if (!data.voice_summary || !data.voice_trained_at) {
    return null
  }

  return {
    voiceSummary: data.voice_summary,
    formality: data.voice_formality as 'casual' | 'moderate' | 'formal',
    warmth: data.voice_warmth,
    signaturePhrases: data.voice_signature_phrases || [],
    greetingStyle: data.voice_greeting_style,
    closingStyle: data.voice_closing_style,
    toneCharacteristics: data.voice_tone_characteristics || [],
    trainedAt: data.voice_trained_at,
  }
}

/**
 * Clear voice profile (for re-training)
 */
export async function clearVoiceProfile(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify user has access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Access denied to this organization',
      }
    }

    if (membership.role !== 'admin') {
      return {
        success: false,
        error: 'Only organization admins can clear voice profile',
      }
    }

    // Clear voice data
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        voice_summary: null,
        voice_formality: null,
        voice_warmth: null,
        voice_signature_phrases: null,
        voice_greeting_style: null,
        voice_closing_style: null,
        voice_tone_characteristics: null,
        voice_trained_at: null,
        voice_trained_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (updateError) {
      return {
        success: false,
        error: 'Failed to clear voice profile',
      }
    }

    revalidatePath('/settings')
    revalidatePath('/communications')

    return { success: true }
  } catch (error) {
    console.error('Clear voice profile error:', error)
    return {
      success: false,
      error: 'Failed to clear voice profile',
    }
  }
}
