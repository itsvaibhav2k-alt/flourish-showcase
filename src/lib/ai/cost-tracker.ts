/**
 * AI Cost Tracker
 *
 * Tracks Claude API usage and estimated costs for monitoring and billing.
 */

import { createClient } from '@/lib/supabase/server'

// Pricing per 1M tokens (as of Dec 2024)
// https://www.anthropic.com/pricing
const PRICING = {
  // Claude Haiku 4.5 (current default)
  'claude-haiku-4-5-20251001': {
    input: 1.0, // $1 per 1M input tokens
    output: 5.0, // $5 per 1M output tokens
    cacheWrite: 1.25, // $1.25 per 1M tokens to write to cache
    cacheRead: 0.1, // $0.10 per 1M tokens to read from cache
  },
  // Claude Sonnet 4 (higher quality option)
  'claude-sonnet-4-20250514': {
    input: 3.0, // $3 per 1M input tokens
    output: 15.0, // $15 per 1M output tokens
    cacheWrite: 3.75, // $3.75 per 1M tokens to write to cache
    cacheRead: 0.3, // $0.30 per 1M tokens to read from cache
  },
  // Legacy models (for historical data)
  'claude-3-5-haiku-20241022': {
    input: 1.0,
    output: 5.0,
    cacheWrite: 1.25,
    cacheRead: 0.1,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
  },
} as const

export interface UsageParams {
  organizationId: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
  model: string
  emailType?: string
  contactId?: string
}

/**
 * Track AI usage and calculate cost
 */
export async function trackUsage(params: UsageParams): Promise<void> {
  const {
    organizationId,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens = 0,
    cacheReadInputTokens = 0,
    model,
    emailType,
    contactId,
  } = params

  // Calculate cost
  const cost = calculateCost({
    model,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
  })

  // Store usage in database
  const supabase = await createClient()

  const { error } = await supabase.from('ai_usage').insert({
    organization_id: organizationId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_creation_tokens: cacheCreationInputTokens,
    cache_read_tokens: cacheReadInputTokens,
    estimated_cost: cost,
    email_type: emailType,
    contact_id: contactId,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Failed to track AI usage:', error)
    // Don't throw - we don't want to fail the email generation if tracking fails
  }
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(params: {
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
}): number {
  const {
    model,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens = 0,
    cacheReadInputTokens = 0,
  } = params

  const pricing =
    PRICING[model as keyof typeof PRICING] || PRICING['claude-haiku-4-5-20251001']

  // Calculate cost per component (per million tokens, then convert to actual)
  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output
  const cacheWriteCost =
    (cacheCreationInputTokens / 1_000_000) * pricing.cacheWrite
  const cacheReadCost = (cacheReadInputTokens / 1_000_000) * pricing.cacheRead

  return inputCost + outputCost + cacheWriteCost + cacheReadCost
}

/**
 * Get monthly usage statistics for an organization
 */
export async function getMonthlyUsage(organizationId: string): Promise<{
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheTokens: number
  estimatedCost: number
  emailCount: number
  breakdown: {
    thankYou: number
    reengagement: number
    volunteer: number
    other: number
  }
}> {
  const supabase = await createClient()

  // Get current month's usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('Failed to fetch monthly usage:', error)
    throw new Error(`Failed to fetch usage: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheTokens: 0,
      estimatedCost: 0,
      emailCount: 0,
      breakdown: {
        thankYou: 0,
        reengagement: 0,
        volunteer: 0,
        other: 0,
      },
    }
  }

  // Aggregate stats
  const inputTokens = data.reduce((sum, row) => sum + (row.input_tokens || 0), 0)
  const outputTokens = data.reduce(
    (sum, row) => sum + (row.output_tokens || 0),
    0
  )
  const cacheTokens = data.reduce(
    (sum, row) =>
      sum +
      (row.cache_creation_tokens || 0) +
      (row.cache_read_tokens || 0),
    0
  )
  const totalTokens = inputTokens + outputTokens + cacheTokens
  const estimatedCost = data.reduce(
    (sum, row) => sum + (row.estimated_cost || 0),
    0
  )

  // Email type breakdown
  const breakdown = {
    thankYou: data.filter(r => r.email_type === 'thank_you').length,
    reengagement: data.filter(r => r.email_type === 'reengagement').length,
    volunteer: data.filter(r =>
      ['volunteer_confirmation', 'volunteer_reminder', 'volunteer_thank_you'].includes(
        r.email_type || ''
      )
    ).length,
    other: data.filter(
      r =>
        !['thank_you', 'reengagement', 'volunteer_confirmation', 'volunteer_reminder', 'volunteer_thank_you'].includes(
          r.email_type || ''
        )
    ).length,
  }

  return {
    totalTokens,
    inputTokens,
    outputTokens,
    cacheTokens,
    estimatedCost,
    emailCount: data.length,
    breakdown,
  }
}

/**
 * Get usage by model
 */
export async function getUsageByModel(
  organizationId: string,
  days: number = 30
): Promise<
  Array<{
    model: string
    requests: number
    totalTokens: number
    estimatedCost: number
  }>
> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())

  if (error) {
    console.error('Failed to fetch usage by model:', error)
    throw new Error(`Failed to fetch usage: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Group by model
  const modelStats = data.reduce(
    (acc, row) => {
      const model = row.model || 'unknown'
      if (!acc[model]) {
        acc[model] = {
          model,
          requests: 0,
          totalTokens: 0,
          estimatedCost: 0,
        }
      }
      acc[model].requests++
      acc[model].totalTokens +=
        (row.input_tokens || 0) +
        (row.output_tokens || 0) +
        (row.cache_creation_tokens || 0) +
        (row.cache_read_tokens || 0)
      acc[model].estimatedCost += row.estimated_cost || 0
      return acc
    },
    {} as Record<string, { model: string; requests: number; totalTokens: number; estimatedCost: number }>
  )

  return Object.values(modelStats).sort((a, b) => b.estimatedCost - a.estimatedCost)
}

/**
 * Check if organization is within usage limits
 * This is a simple check - you might want to implement more sophisticated limits
 */
export async function checkUsageLimit(
  organizationId: string,
  monthlyLimit: number = 100 // Default $100/month limit
): Promise<{
  withinLimit: boolean
  currentSpend: number
  limit: number
  percentUsed: number
}> {
  const usage = await getMonthlyUsage(organizationId)

  const percentUsed = (usage.estimatedCost / monthlyLimit) * 100

  return {
    withinLimit: usage.estimatedCost < monthlyLimit,
    currentSpend: usage.estimatedCost,
    limit: monthlyLimit,
    percentUsed,
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`
  }
  return tokens.toString()
}
