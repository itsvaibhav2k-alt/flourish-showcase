/**
 * Custom Tile Generator
 *
 * Generates AI insights based on custom user prompts and selected data sources.
 * Allows users to create personalized tiles with specific questions.
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { trackUsage } from '@/lib/ai/cost-tracker'
import { buildTileContext, serializeTileContext } from '../context-builder'
import { getCachedTileData, setCachedTileData } from '../cache'

export interface CustomTileInsight {
  summary: string
  insights: string[]
  data: Record<string, unknown>
}

/**
 * Generate custom tile insights based on user prompt and data sources
 */
export async function generateCustomTileInsights(
  organizationId: string,
  prompt: string,
  dataSources: string[],
  tileId?: string
): Promise<CustomTileInsight> {
  // Validate inputs
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required for custom tiles')
  }

  if (!dataSources || dataSources.length === 0) {
    throw new Error('At least one data source is required')
  }

  // Check cache if tileId provided
  if (tileId) {
    const cached = await getCachedTileData<CustomTileInsight>(
      organizationId,
      'custom',
      tileId
    )

    if (cached) {
      return cached
    }
  }

  // Build context based on selected data sources
  const validSources = dataSources.filter(s =>
    ['donors', 'volunteers', 'activity'].includes(s)
  )

  if (validSources.length === 0) {
    throw new Error('No valid data sources selected')
  }

  const context = await buildTileContext(organizationId, validSources)
  const contextStr = serializeTileContext(context)

  const systemPrompt = `You are an expert nonprofit data analyst helping organizations answer specific questions about their data.

Your task is to analyze organizational data and answer the user's specific question or fulfill their custom request.

Return your analysis as a JSON object with this exact structure:
{
  "summary": "2-3 sentence answer to the user's question",
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "data": {
    "key1": "value1",
    "key2": 123,
    "key3": ["array", "of", "values"]
  }
}

The "data" object should contain any structured data that supports your insights. This could include:
- Calculated metrics
- Lists of relevant items
- Percentages or statistics
- Trends or patterns

CRITICAL RULES:
- Answer ONLY based on the provided data
- If data is insufficient, say so in the summary
- Provide 2-5 actionable insights
- Make insights specific and data-driven
- Return ONLY valid JSON, no additional text
- Be concise but thorough`

  const userPrompt = `${contextStr}

USER'S QUESTION/REQUEST:
${prompt}

Analyze the data above and answer the user's question. Provide specific insights based on the available data.`

  try {
    const response = await generateWithCaching({
      systemPrompt,
      userPrompt,
      model: MODELS.HAIKU,
      maxTokens: 2048,
      temperature: 0.5, // Moderate creativity for varied custom responses
    })

    // Track usage
    await trackUsage({
      organizationId,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'tile_custom',
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const insights = JSON.parse(jsonMatch[0]) as CustomTileInsight

    // Validate structure
    if (!insights.summary || !insights.insights) {
      throw new Error('Invalid insights structure')
    }

    // Ensure data object exists
    if (!insights.data) {
      insights.data = {}
    }

    // Cache the results if tileId provided
    if (tileId) {
      await setCachedTileData(organizationId, 'custom', insights, tileId, 24)
    }

    return insights
  } catch (error) {
    console.error('Error generating custom tile insights:', error)

    // Return fallback response
    return {
      summary: `Unable to fully analyze your request: "${prompt}". The available data may be insufficient to answer this question completely.`,
      insights: [
        'Try rephrasing your question to be more specific',
        'Ensure you have selected the appropriate data sources',
        'Check that there is sufficient data in the selected areas',
      ],
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt,
        dataSources: validSources,
      },
    }
  }
}

/**
 * Validate custom prompt
 */
export function validateCustomPrompt(prompt: string): {
  valid: boolean
  error?: string
} {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' }
  }

  if (prompt.length > 500) {
    return { valid: false, error: 'Prompt must be 500 characters or less' }
  }

  // Check for potentially problematic content
  const lowerPrompt = prompt.toLowerCase()
  const disallowedPatterns = [
    'ignore previous',
    'system prompt',
    'forget all',
    'disregard',
  ]

  for (const pattern of disallowedPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return {
        valid: false,
        error: 'Prompt contains disallowed content',
      }
    }
  }

  return { valid: true }
}

/**
 * Get suggested custom prompts
 */
export function getSuggestedCustomPrompts(): Array<{
  title: string
  prompt: string
  dataSources: string[]
}> {
  return [
    {
      title: 'Donor Retention Analysis',
      prompt: 'What is our donor retention rate and how can we improve it?',
      dataSources: ['donors', 'activity'],
    },
    {
      title: 'Monthly Giving Trends',
      prompt: 'How has our monthly giving changed over the year?',
      dataSources: ['donors'],
    },
    {
      title: 'Volunteer Engagement',
      prompt: 'Which volunteers are most engaged and should we recognize?',
      dataSources: ['volunteers'],
    },
    {
      title: 'Campaign Performance',
      prompt: 'Which campaigns have been most successful this year?',
      dataSources: ['donors', 'activity'],
    },
    {
      title: 'Major Donor Pipeline',
      prompt: 'Who are our potential major donors we should cultivate?',
      dataSources: ['donors'],
    },
    {
      title: 'Volunteer Reliability',
      prompt: 'What is our volunteer no-show rate and how can we reduce it?',
      dataSources: ['volunteers'],
    },
    {
      title: 'New Donor Acquisition',
      prompt: 'How effective is our new donor acquisition this year?',
      dataSources: ['donors', 'activity'],
    },
    {
      title: 'Overall Engagement Score',
      prompt: 'What is our overall constituent engagement score?',
      dataSources: ['donors', 'volunteers', 'activity'],
    },
  ]
}
