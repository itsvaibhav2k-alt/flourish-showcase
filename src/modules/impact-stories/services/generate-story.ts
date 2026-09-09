/**
 * Impact Story Generation Service
 *
 * Uses Claude AI to generate personalized impact narratives for donors
 */

import { generateWithCaching, MODELS } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export interface ImpactMetricCalculation {
  metric_name: string
  metric_label: string
  metric_label_plural: string
  units_impacted: number
  cost_per_unit: number
  icon?: string
}

export interface GenerateStoryParams {
  organizationId: string
  contactId: string
  periodStart?: Date
  periodEnd?: Date
}

export interface GeneratedStory {
  title: string
  content: string
  metrics: Record<string, number>
  totalGiving: number
}

/**
 * Get system prompt for impact story generation
 */
function getImpactStorySystemPrompt(): string {
  return `You are an expert nonprofit storyteller crafting personalized impact narratives for donors.

YOUR TASK:
Write a compelling, personalized impact story that shows a donor the tangible difference their giving has made.

STORY REQUIREMENTS:
- Length: 200-350 words
- Tone: Warm, grateful, inspiring, and personal
- Structure:
  1. Engaging opening that acknowledges their generosity
  2. Specific impact metrics woven into a narrative (NOT just a list)
  3. Paint a vivid picture of the lives changed
  4. Forward-looking statement about continuing impact
  5. Heartfelt closing

CRITICAL RULES:
- Make it story-driven, NOT data-driven (weave numbers naturally into narrative)
- Focus on PEOPLE and LIVES CHANGED, not just statistics
- Use specific details to make it tangible and memorable
- Be authentic and genuine, avoid hyperbole
- Keep paragraphs short (2-3 sentences)
- NO asks for additional donations - this is pure appreciation

OUTPUT FORMAT:
Title: [An inspiring headline that captures their impact in 8-12 words]

[Story content - well-crafted narrative that naturally incorporates the impact metrics]

Return ONLY the title and story content. Do NOT include donor name, signature, or any metadata.`
}

/**
 * Get user prompt for impact story generation
 */
function getImpactStoryUserPrompt(
  donorName: string,
  totalGiving: number,
  metrics: ImpactMetricCalculation[],
  timePeriod: string
): string {
  const metricsText = metrics
    .map(
      (m) =>
        `- ${m.units_impacted.toLocaleString()} ${m.units_impacted === 1 ? m.metric_label : m.metric_label_plural}`
    )
    .join('\n')

  return `DONOR INFORMATION:
- Name: ${donorName}
- Total Giving ${timePeriod}: $${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

IMPACT CREATED:
${metricsText}

TIME PERIOD: ${timePeriod}

Generate a personalized impact story that shows how ${donorName}'s generosity of $${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} created real, tangible change in people's lives.

Weave these impact numbers naturally into an inspiring narrative. Make them FEEL the difference they made.`
}

/**
 * Calculate impact metrics based on donor giving and org metrics
 */
async function calculateImpactMetrics(
  organizationId: string,
  totalGiving: number
): Promise<ImpactMetricCalculation[]> {
  const supabase = await createClient()

  // Get active impact metrics for the organization
  const { data: metrics, error } = await supabase
    .from('impact_metrics')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('display_order')

  if (error || !metrics || metrics.length === 0) {
    throw new Error('No active impact metrics found for organization')
  }

  // Calculate units impacted for each metric
  const calculations: ImpactMetricCalculation[] = metrics.map((metric) => {
    const unitsImpacted = Math.floor(totalGiving / Number(metric.cost_per_unit))

    return {
      metric_name: metric.metric_name,
      metric_label: metric.unit_label,
      metric_label_plural: metric.unit_label_plural || `${metric.unit_label}s`,
      units_impacted: unitsImpacted,
      cost_per_unit: Number(metric.cost_per_unit),
      icon: metric.icon || undefined,
    }
  })

  // Filter out metrics with 0 impact
  return calculations.filter((calc) => calc.units_impacted > 0)
}

/**
 * Get donor giving total for specified period
 */
async function getDonorGiving(
  contactId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<{ total: number; donorName: string; organizationId: string }> {
  const supabase = await createClient()

  // Get contact info
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('first_name, last_name, organization_id')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    throw new Error('Contact not found')
  }

  // Build query for gifts
  let query = supabase
    .from('gifts')
    .select('amount')
    .eq('contact_id', contactId)

  // Add date filters if provided
  if (periodStart) {
    query = query.gte('gift_date', periodStart.toISOString().split('T')[0])
  }
  if (periodEnd) {
    query = query.lte('gift_date', periodEnd.toISOString().split('T')[0])
  }

  const { data: gifts, error: giftsError } = await query

  if (giftsError) {
    throw new Error('Failed to fetch donor gifts')
  }

  const total = gifts?.reduce((sum, gift) => sum + Number(gift.amount), 0) || 0

  const donorName = `${contact.first_name || 'Friend'} ${contact.last_name || ''}`.trim()

  return {
    total,
    donorName,
    organizationId: contact.organization_id,
  }
}

/**
 * Parse the AI response into title and content
 */
function parseStoryResponse(response: string): { title: string; content: string } {
  const titleMatch = response.match(/Title:\s*(.+)/i)
  const title = titleMatch ? titleMatch[1].trim() : 'Your Impact Story'

  // Get content (everything after title line)
  let content = response
  if (titleMatch) {
    content = response
      .substring(response.indexOf(titleMatch[0]) + titleMatch[0].length)
      .trim()
  }

  return { title, content }
}

/**
 * Generate a personalized impact story for a donor
 */
export async function generateImpactStory(
  params: GenerateStoryParams
): Promise<GeneratedStory> {
  const { organizationId, contactId, periodStart, periodEnd } = params

  // Determine time period label
  let timePeriod = 'this year'
  if (periodStart && periodEnd) {
    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()

    if (startYear === endYear) {
      timePeriod = `in ${startYear}`
    } else {
      timePeriod = `from ${startYear} to ${endYear}`
    }
  } else if (!periodStart && !periodEnd) {
    timePeriod = 'as a supporter'
  }

  // Get donor giving for period
  const { total, donorName, organizationId: orgId } = await getDonorGiving(
    contactId,
    periodStart,
    periodEnd
  )

  if (total === 0) {
    throw new Error('Donor has no gifts in the specified period')
  }

  // Use provided organizationId or fall back to contact's organization
  const finalOrgId = organizationId || orgId

  // Calculate impact metrics
  const impactMetrics = await calculateImpactMetrics(finalOrgId, total)

  if (impactMetrics.length === 0) {
    throw new Error('Unable to calculate impact - no applicable metrics found')
  }

  // Generate story with Claude
  const systemPrompt = getImpactStorySystemPrompt()
  const userPrompt = getImpactStoryUserPrompt(
    donorName,
    total,
    impactMetrics,
    timePeriod
  )

  const response = await generateWithCaching({
    systemPrompt,
    userPrompt,
    model: MODELS.HAIKU, // Use Haiku for cost efficiency
    maxTokens: 1024,
    temperature: 1.0,
  })

  // Parse the response
  const { title, content } = parseStoryResponse(response.content)

  // Build metrics object for storage
  const metricsObject: Record<string, number> = {}
  impactMetrics.forEach((metric) => {
    metricsObject[metric.metric_name] = metric.units_impacted
  })

  return {
    title,
    content,
    metrics: metricsObject,
    totalGiving: total,
  }
}
