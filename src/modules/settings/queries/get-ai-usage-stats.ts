'use server'

import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { getMonthlyUsage } from '@/lib/ai/cost-tracker'

export interface AIUsageStats {
  totalCost: number
  emailCount: number
  tokenCount: number
  breakdown: {
    thankYou: number
    reengagement: number
    volunteer: number
  }
}

/**
 * Get AI usage statistics for the current organization.
 * Returns monthly usage including cost, email count, and breakdown by type.
 */
export async function getAIUsageStats(): Promise<AIUsageStats> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Use the existing getMonthlyUsage function from cost-tracker
    const usage = await getMonthlyUsage(organizationId)

    return {
      totalCost: usage.estimatedCost,
      emailCount: usage.emailCount,
      tokenCount: usage.totalTokens,
      breakdown: {
        thankYou: usage.breakdown.thankYou,
        reengagement: usage.breakdown.reengagement,
        volunteer: usage.breakdown.volunteer,
      },
    }
  } catch (error) {
    console.error('Error in getAIUsageStats:', error)
    // Return safe defaults on error
    return {
      totalCost: 0,
      emailCount: 0,
      tokenCount: 0,
      breakdown: {
        thankYou: 0,
        reengagement: 0,
        volunteer: 0,
      },
    }
  }
}

// Note: formatCost and formatTokens should be imported directly from '@/lib/ai/cost-tracker'
