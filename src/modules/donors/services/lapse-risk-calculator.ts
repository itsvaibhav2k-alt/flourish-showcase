/**
 * Lapse Risk Calculator
 *
 * Calculates the risk of a donor lapsing based on their giving history.
 * Uses different logic for new donors vs. repeat donors.
 */

export type LapseRisk = 'low' | 'medium' | 'high' | 'unknown'

export interface DonorGivingHistory {
  giftCount: number
  lastGiftDate: Date | null
  avgGiftGap: number | null // Average days between gifts
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Calculate lapse risk for a donor
 *
 * Logic:
 * - For new donors (1 gift):
 *   - High risk if > 90 days since gift
 *   - Medium risk if > 30 days since gift
 *   - Low risk otherwise
 * - For repeat donors (2+ gifts):
 *   - Compare time since last gift to average gift gap
 *   - High risk if > 2x average gap
 *   - Medium risk if > 1.5x average gap
 *   - Low risk otherwise
 * - Unknown if no gift history
 */
export function calculateLapseRisk(contact: DonorGivingHistory): LapseRisk {
  const { giftCount, lastGiftDate, avgGiftGap } = contact

  // No gift history
  if (giftCount === 0 || !lastGiftDate) {
    return 'unknown'
  }

  // Calculate days since last gift
  const daysSinceLastGift = Math.floor(
    (Date.now() - lastGiftDate.getTime()) / MILLISECONDS_PER_DAY
  )

  // New donor (single gift)
  if (giftCount === 1) {
    if (daysSinceLastGift > 90) {
      return 'high'
    }
    if (daysSinceLastGift > 30) {
      return 'medium'
    }
    return 'low'
  }

  // Repeat donor
  if (avgGiftGap === null || avgGiftGap === 0) {
    // Fallback to simple time-based logic if no average gap
    if (daysSinceLastGift > 365) {
      return 'high'
    }
    if (daysSinceLastGift > 180) {
      return 'medium'
    }
    return 'low'
  }

  // Compare to average gap
  if (daysSinceLastGift > avgGiftGap * 2) {
    return 'high'
  }
  if (daysSinceLastGift > avgGiftGap * 1.5) {
    return 'medium'
  }

  return 'low'
}

/**
 * Get a human-readable description of the lapse risk
 */
export function getLapseRiskDescription(risk: LapseRisk): string {
  switch (risk) {
    case 'low':
      return 'This donor is engaged and giving regularly'
    case 'medium':
      return 'This donor may need engagement to maintain giving'
    case 'high':
      return 'This donor is at high risk of lapsing and needs immediate attention'
    case 'unknown':
      return 'Not enough data to determine lapse risk'
  }
}

/**
 * Get suggested actions based on lapse risk
 */
export function getLapseRiskActions(risk: LapseRisk): string[] {
  switch (risk) {
    case 'low':
      return ['Send thank you note', 'Include in regular updates']
    case 'medium':
      return [
        'Schedule follow-up call',
        'Send personalized update',
        'Invite to upcoming event',
      ]
    case 'high':
      return [
        'Urgent: Schedule personal meeting',
        'Send impact report',
        'Offer giving options',
        'Address any concerns',
      ]
    case 'unknown':
      return ['Record first gift to track engagement']
  }
}
