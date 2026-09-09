/**
 * Helper functions for AI cost tracking
 * Provides convenience wrappers around the core tracking functions
 */

import { trackUsage } from './cost-tracker'

export interface AIUsageParams {
  organizationId: string
  feature: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  costUsd: number
  metadata?: Record<string, any>
}

/**
 * Track AI usage for any feature (not just emails)
 * This is a more generic wrapper around trackUsage
 */
export async function trackAIUsage(params: AIUsageParams): Promise<void> {
  const {
    organizationId,
    feature,
    model,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    metadata,
  } = params

  // Map feature to email_type for backwards compatibility
  // For grant writing, we'll use the feature name directly
  const emailType = feature.startsWith('grant_') ? feature : undefined

  await trackUsage({
    organizationId,
    model,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens: cacheCreationTokens,
    cacheReadInputTokens: cacheReadTokens,
    emailType,
    contactId: metadata?.contactId,
  })
}
