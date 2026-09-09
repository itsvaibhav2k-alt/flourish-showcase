/**
 * Voice Samples Queries
 *
 * Queries for retrieving voice training data and status.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface VoiceSample {
  id: string
  content: string
  source: string
  created_at: string
}

export interface VoiceSummary {
  voiceSummary: string
  formality: 'casual' | 'moderate' | 'formal'
  warmth: number
  signaturePhrases: string[]
  greetingStyle: string
  closingStyle: string
  toneCharacteristics: string[]
  trainedAt: string
}

/**
 * Get all voice samples for the current organization
 */
export async function getVoiceSamples(): Promise<VoiceSample[]> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return []
  }

  // Fetch organization to get voice_samples array
  const { data, error } = await supabase
    .from('organizations')
    .select('voice_samples')
    .eq('id', organizationId)
    .single()

  if (error || !data || !data.voice_samples) {
    return []
  }

  // Convert voice_samples array to VoiceSample objects
  // Each sample in the array is stored as a JSON string with format: {content, source, created_at}
  try {
    const samples = data.voice_samples.map((sample: string, index: number) => {
      try {
        const parsed = JSON.parse(sample)
        return {
          id: `sample-${index}`,
          content: parsed.content,
          source: parsed.source,
          created_at: parsed.created_at,
        }
      } catch {
        // If parsing fails, treat as plain text
        return {
          id: `sample-${index}`,
          content: sample,
          source: 'Unknown',
          created_at: new Date().toISOString(),
        }
      }
    })

    return samples
  } catch {
    return []
  }
}

/**
 * Get the current voice profile summary for the organization
 */
export async function getVoiceSummary(): Promise<VoiceSummary | null> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return null
  }

  const { data, error } = await supabase
    .from('organizations')
    .select(
      'voice_summary, voice_formality, voice_warmth, voice_signature_phrases, voice_greeting_style, voice_closing_style, voice_tone_characteristics, voice_trained_at'
    )
    .eq('id', organizationId)
    .single()

  if (error || !data || !data.voice_summary || !data.voice_trained_at) {
    return null
  }

  return {
    voiceSummary: data.voice_summary,
    formality: (data.voice_formality as 'casual' | 'moderate' | 'formal') || 'moderate',
    warmth: data.voice_warmth || 5,
    signaturePhrases: data.voice_signature_phrases || [],
    greetingStyle: data.voice_greeting_style || '',
    closingStyle: data.voice_closing_style || '',
    toneCharacteristics: data.voice_tone_characteristics || [],
    trainedAt: data.voice_trained_at,
  }
}

/**
 * Check if organization has a trained voice profile
 */
export async function hasTrainedVoice(): Promise<boolean> {
  const summary = await getVoiceSummary()
  return summary !== null
}

/**
 * Get voice samples count
 */
export async function getVoiceSamplesCount(): Promise<number> {
  const samples = await getVoiceSamples()
  return samples.length
}
