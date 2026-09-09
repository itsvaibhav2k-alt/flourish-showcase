/**
 * Claude AI API Wrapper
 *
 * Provides functions for interacting with Claude AI API for email generation
 * and voice analysis with prompt caching support.
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Model configuration
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001', // Cost-effective for most emails (Haiku 4.5)
  SONNET: 'claude-sonnet-4-20250514', // Higher quality for major donors (Sonnet 4)
} as const

export type ClaudeModel = typeof MODELS[keyof typeof MODELS]

export interface GenerateParams {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  model?: ClaudeModel
  temperature?: number
}

export interface GenerateResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens?: number
    cacheReadInputTokens?: number
  }
  model: string
}

/**
 * Generate text with Claude AI using prompt caching
 *
 * Prompt caching reduces costs by caching the system prompt
 * for repeated use within a 5-minute window.
 */
export async function generateWithCaching(
  params: GenerateParams
): Promise<GenerateResponse> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = 1024,
    model = MODELS.HAIKU,
    temperature = 1.0,
  } = params

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract text content from response
    const content = message.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')

    return {
      content,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? undefined,
        cacheReadInputTokens: message.usage.cache_read_input_tokens ?? undefined,
      },
      model: message.model,
    }
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export interface VoiceAnalysis {
  voiceSummary: string
  formality: 'casual' | 'moderate' | 'formal'
  warmth: number // 1-10
  signaturePhrases: string[]
  greetingStyle: string
  closingStyle: string
  toneCharacteristics: string[]
}

/**
 * Analyze voice samples to extract organizational communication style
 */
export async function analyzeVoiceSamples(
  samples: string[]
): Promise<VoiceAnalysis> {
  if (samples.length < 3) {
    throw new Error('At least 3 email samples are required for voice analysis')
  }

  const systemPrompt = `You are an expert at analyzing organizational communication styles and voice.
You will receive several email samples from a nonprofit organization and must extract their unique voice characteristics.

Analyze the following aspects:
1. Formality level (casual, moderate, formal)
2. Warmth and personal connection (1-10 scale)
3. Signature phrases they commonly use
4. How they typically greet recipients
5. How they typically close emails
6. Overall tone characteristics

Return your analysis as a JSON object with this exact structure:
{
  "voiceSummary": "A detailed paragraph describing the overall voice and style",
  "formality": "casual|moderate|formal",
  "warmth": 1-10,
  "signaturePhrases": ["phrase1", "phrase2"],
  "greetingStyle": "Description of how they greet",
  "closingStyle": "Description of how they close",
  "toneCharacteristics": ["characteristic1", "characteristic2"]
}`

  const userPrompt = `Please analyze these ${samples.length} email samples and extract the communication voice:

${samples.map((sample, i) => `
--- EMAIL SAMPLE ${i + 1} ---
${sample}
-------------------
`).join('\n')}

Provide your analysis as a JSON object.`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      model: MODELS.HAIKU, // Use Haiku for cost efficiency
      temperature: 0.5, // Lower temperature for more consistent analysis
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse voice analysis response')
    }

    const analysis = JSON.parse(jsonMatch[0]) as VoiceAnalysis

    // Validate the analysis structure
    if (
      !analysis.voiceSummary ||
      !analysis.formality ||
      typeof analysis.warmth !== 'number'
    ) {
      throw new Error('Invalid voice analysis structure')
    }

    return analysis
  } catch (error) {
    console.error('Voice analysis error:', error)
    throw new Error(
      `Failed to analyze voice samples: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate a simple text response without caching
 * Useful for one-off queries or when caching isn't beneficial
 */
export async function generateSimple(params: {
  prompt: string
  maxTokens?: number
  model?: ClaudeModel
}): Promise<string> {
  const { prompt, maxTokens = 1024, model = MODELS.HAIKU } = params

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n')
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
