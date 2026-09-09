import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

interface GenerateImpactNarrativeInput {
  donorFirstName: string
  totalGiving: number
  impactBreakdown: Record<string, number>
  timePeriod: string
}

interface GenerateImpactNarrativeOutput {
  headline: string
  narrative: string
}

/**
 * Generates an emotional, personalized impact narrative using Claude AI
 */
export async function generateImpactNarrative(
  input: GenerateImpactNarrativeInput
): Promise<GenerateImpactNarrativeOutput> {
  const { donorFirstName, totalGiving, impactBreakdown, timePeriod } = input

  // Get organization name
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  let organizationName = 'our organization'
  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (org) {
      organizationName = org.name
    }
  }

  // Format impact breakdown for prompt
  const impactLines = Object.entries(impactBreakdown)
    .map(([key, value]) => `- ${value} ${key}`)
    .join('\n')

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const systemPrompt = `You are a storytelling expert for nonprofit organizations. Your job is to create emotional, personalized impact stories that show donors the real-world difference their contributions make.

RULES:
1. Be warm, personal, and emotional
2. Focus on lives changed, not just numbers
3. Use the donor's first name naturally
4. Make the impact feel tangible and real
5. Keep it concise but powerful
6. Avoid corporate or overly formal language
7. Create a headline that captures the heart of the story
8. Make donors feel like heroes

OUTPUT FORMAT:
Return a JSON object with exactly two fields:
{
  "headline": "A short, emotional headline (5-8 words)",
  "narrative": "The full impact story (2-3 paragraphs, 100-150 words)"
}`

  const userPrompt = `Generate a personalized impact story for ${donorFirstName}.

DONOR INFORMATION:
- Name: ${donorFirstName}
- Total giving (${timePeriod}): $${totalGiving.toFixed(2)}
- Organization: ${organizationName}

IMPACT ACHIEVED:
${impactLines || 'No specific impact metrics available'}

Create a headline and narrative that makes ${donorFirstName} feel the profound difference they've made. Focus on the human impact, not just the statistics.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    const result = JSON.parse(content.text)

    // Track AI usage
    if (organizationId) {
      await supabase.from('ai_usage').insert({
        organization_id: organizationId,
        email_type: 'impact_story',
        tokens_used: response.usage.input_tokens + response.usage.output_tokens,
        cost: (response.usage.input_tokens * 0.003 + response.usage.output_tokens * 0.015) / 1000,
        model: 'claude-3-5-sonnet-20241022',
      })
    }

    return {
      headline: result.headline,
      narrative: result.narrative,
    }
  } catch (error) {
    console.error('Error generating impact narrative:', error)

    // Fallback narrative
    const totalImpact = Object.values(impactBreakdown).reduce((sum, val) => sum + val, 0)
    return {
      headline: `${donorFirstName}, You Changed ${totalImpact} Lives`,
      narrative: `Dear ${donorFirstName},\n\nYour generous support of $${totalGiving.toFixed(2)} has created real, lasting change in our community. Through your partnership with ${organizationName}, you've made a tangible difference that will be felt for years to come.\n\nThank you for believing in our mission and for being such an important part of our story.`,
    }
  }
}
