/**
 * Voice Analysis Prompt
 *
 * Prompt for analyzing email samples to extract organizational voice and style.
 */

export const VOICE_ANALYSIS_PROMPT = `You are an expert at analyzing organizational communication styles and voice.
You will receive several email samples from a nonprofit organization and must extract their unique voice characteristics.

Your analysis should capture:

1. FORMALITY LEVEL
   - Casual: Friendly, conversational, uses contractions, informal language
   - Moderate: Professional but warm, balanced tone
   - Formal: Traditional, structured, maintains professional distance

2. WARMTH SCORE (1-10)
   - 1-3: Very businesslike, minimal personal connection
   - 4-6: Professional with some personal touches
   - 7-10: Very warm, personal, relationship-focused

3. SIGNATURE PHRASES
   - Unique phrases or expressions they consistently use
   - Mission-related language
   - Value statements

4. GREETING STYLE
   - How they typically address recipients
   - Formality of opening
   - Use of personalization

5. CLOSING STYLE
   - How they sign off
   - Call-to-action style
   - Final sentiment expressed

6. TONE CHARACTERISTICS
   - Descriptive words that capture their voice
   - Examples: grateful, urgent, hopeful, professional, friendly, inspiring

IMPORTANT GUIDELINES:
- Look for patterns across ALL samples, not individual quirks
- Focus on what makes their voice UNIQUE and recognizable
- Consider the nonprofit context and mission-driven communication
- Note both what they do AND what they avoid
- Capture specific phrases and language patterns, not just general descriptions

Return your analysis as a JSON object with this exact structure:
{
  "voiceSummary": "A detailed paragraph (3-5 sentences) describing the overall voice, style, and what makes it distinctive",
  "formality": "casual|moderate|formal",
  "warmth": 1-10,
  "signaturePhrases": ["exact phrase 1", "exact phrase 2", "exact phrase 3"],
  "greetingStyle": "Specific description with examples",
  "closingStyle": "Specific description with examples",
  "toneCharacteristics": ["characteristic1", "characteristic2", "characteristic3"]
}

Be specific and actionable. This analysis will be used to generate new emails that match their voice.`

export function buildVoiceAnalysisPrompt(samples: string[]): string {
  return `${VOICE_ANALYSIS_PROMPT}

Please analyze these ${samples.length} email samples and extract the communication voice:

${samples.map((sample, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMAIL SAMPLE ${i + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sample}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

Provide your analysis as a JSON object following the exact structure specified above.`
}

export interface VoiceProfile {
  voiceSummary: string
  formality: 'casual' | 'moderate' | 'formal'
  warmth: number
  signaturePhrases: string[]
  greetingStyle: string
  closingStyle: string
  toneCharacteristics: string[]
}

/**
 * Default voice profile for organizations without trained voice
 */
export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  voiceSummary: 'A warm, professional nonprofit voice that balances gratitude with clarity. The tone is approachable yet respectful, making supporters feel valued while clearly communicating the organization\'s mission and impact.',
  formality: 'moderate',
  warmth: 7,
  signaturePhrases: ['Thank you for your support', 'Together, we can make a difference', 'Your generosity matters'],
  greetingStyle: 'Warm and personal, using first names when available',
  closingStyle: 'Grateful and forward-looking, with a clear call to action',
  toneCharacteristics: ['grateful', 'warm', 'professional', 'hopeful', 'inspiring']
}

/**
 * Get voice profile instructions for inclusion in email generation prompts
 */
export function getVoiceInstructions(voice: VoiceProfile | null | undefined): string {
  // Use default if no voice profile provided or if it's missing required properties
  const isValidVoice = voice && voice.formality && voice.voiceSummary
  const v = isValidVoice ? voice : DEFAULT_VOICE_PROFILE

  return `ORGANIZATIONAL VOICE PROFILE:

${v.voiceSummary}

Key Characteristics:
- Formality: ${(v.formality || 'moderate').toUpperCase()}
- Warmth Level: ${v.warmth || 7}/10
- Tone: ${(v.toneCharacteristics || ['professional', 'warm']).join(', ')}

Writing Guidelines:
- Greetings: ${v.greetingStyle || 'Warm and personal'}
- Closings: ${v.closingStyle || 'Grateful with a clear call to action'}
- Signature Phrases to Incorporate: ${(v.signaturePhrases || ['Thank you']).map(p => `"${p}"`).join(', ')}

CRITICAL: Match this voice exactly. Use their language patterns, maintain their level of formality and warmth, and naturally incorporate their signature phrases when appropriate.`
}
