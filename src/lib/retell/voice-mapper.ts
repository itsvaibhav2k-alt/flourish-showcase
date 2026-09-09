/**
 * Voice Profile to Retell Agent Mapper
 *
 * Maps organizational voice profiles to Retell voice selection,
 * speed, and system prompt configuration.
 */

import { VoiceProfile } from '@/lib/ai/prompts/voice-analysis';

// Retell ElevenLabs voice IDs mapped to formality + warmth
// Flora is female - using warm, natural-sounding female voices
const VOICE_MAP: Record<string, { voiceId: string; name: string }> = {
  // Warm + casual/moderate
  'warm-casual': { voiceId: '11labs-Lily', name: 'Lily' },
  'warm-moderate': { voiceId: '11labs-Lily', name: 'Lily' },
  'warm-formal': { voiceId: '11labs-Grace', name: 'Grace' },
  // Neutral warmth
  'neutral-casual': { voiceId: '11labs-Lily', name: 'Lily' },
  'neutral-moderate': { voiceId: '11labs-Grace', name: 'Grace' },
  'neutral-formal': { voiceId: '11labs-Grace', name: 'Grace' },
  // Cool/professional
  'cool-casual': { voiceId: '11labs-Julia', name: 'Julia' },
  'cool-moderate': { voiceId: '11labs-Julia', name: 'Julia' },
  'cool-formal': { voiceId: '11labs-Julia', name: 'Julia' },
};

/**
 * Determine warmth category from warmth score (1-10)
 */
function getWarmthCategory(warmth: number): 'warm' | 'neutral' | 'cool' {
  if (warmth >= 7) return 'warm';
  if (warmth >= 4) return 'neutral';
  return 'cool';
}

/**
 * Map a VoiceProfile to a Retell voice ID
 */
export function mapVoiceProfileToVoiceId(profile: VoiceProfile): string {
  const warmthCategory = getWarmthCategory(profile.warmth);
  const key = `${warmthCategory}-${profile.formality}`;
  return VOICE_MAP[key]?.voiceId ?? '11labs-Lily';
}

/**
 * Map a VoiceProfile to a voice speed (0.5 - 2.0)
 */
export function mapVoiceProfileToSpeed(profile: VoiceProfile): number {
  // More formal = slightly slower, more casual = slightly faster
  switch (profile.formality) {
    case 'formal':
      return 0.9;
    case 'moderate':
      return 1.0;
    case 'casual':
      return 1.05;
    default:
      return 1.0;
  }
}
