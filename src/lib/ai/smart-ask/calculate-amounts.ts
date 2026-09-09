/**
 * Smart Ask Algorithm
 *
 * Calculates optimal donation amounts based on donor history and capacity.
 * Returns three suggested amounts: stretch (ambitious), target (likely), accessible (safe)
 */

export interface DonorGiftHistory {
  gifts: Array<{
    amount: number
    gift_date: string
  }>
  lastGiftAmount: number | null
  averageGiftAmount: number | null
  largestGiftAmount: number | null
  giftCount: number
}

export interface DonorCapacity {
  capacity_score?: number | null // 0-100 from giving_potential table
  affinity_score?: number | null // 0-100
  propensity_score?: number | null // 0-100
}

export interface SmartAskConfig {
  stretchMultiplier?: number // Default 1.5
  targetMultiplier?: number // Default 1.2
  accessibleMultiplier?: number // Default 1.0
  capacityWeight?: number // Default 0.3 - how much to factor in capacity
  highRiskReduction?: number // Default 0.2 (20%)
  mediumRiskReduction?: number // Default 0.1 (10%)
}

export interface SmartAskResult {
  stretchAmount: number
  targetAmount: number
  accessibleAmount: number
  baseAmount: number
  stretchConfidence: number // 0-1
  targetConfidence: number // 0-1
  accessibleConfidence: number // 0-1
  reasoning: string
  calculationMethod: string
}

const DEFAULT_CONFIG: Required<SmartAskConfig> = {
  stretchMultiplier: 1.5,
  targetMultiplier: 1.2,
  accessibleMultiplier: 1.0,
  capacityWeight: 0.3,
  highRiskReduction: 0.2,
  mediumRiskReduction: 0.1,
}

/**
 * Calculate smart ask amounts for a donor
 *
 * Algorithm:
 * 1. Determine base amount from giving history
 * 2. Calculate capacity factor from giving_potential scores
 * 3. Apply multipliers and capacity adjustments
 * 4. Adjust for lapse risk if applicable
 * 5. Round to friendly amounts
 */
export function calculateSmartAsk(
  giftHistory: DonorGiftHistory,
  capacity: DonorCapacity = {},
  lapseRisk: 'low' | 'medium' | 'high' | 'unknown' = 'unknown',
  config: SmartAskConfig = {}
): SmartAskResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Step 1: Determine base amount
  const { baseAmount, method, confidence: baseConfidence } = determineBaseAmount(giftHistory)

  // Step 2: Calculate capacity factor (0 to 1)
  const capacityFactor = calculateCapacityFactor(capacity)

  // Step 3: Calculate raw amounts with capacity adjustments
  let stretchAmount = baseAmount * (cfg.stretchMultiplier + capacityFactor * cfg.capacityWeight)
  let targetAmount = baseAmount * (cfg.targetMultiplier + capacityFactor * cfg.capacityWeight)
  let accessibleAmount = baseAmount * (cfg.accessibleMultiplier + capacityFactor * cfg.capacityWeight * 0.5)

  // Step 4: Adjust for lapse risk
  let riskAdjustment = 1.0
  if (lapseRisk === 'high') {
    riskAdjustment = 1.0 - cfg.highRiskReduction
  } else if (lapseRisk === 'medium') {
    riskAdjustment = 1.0 - cfg.mediumRiskReduction
  }

  stretchAmount *= riskAdjustment
  targetAmount *= riskAdjustment
  accessibleAmount *= riskAdjustment

  // Step 5: Round to friendly amounts
  stretchAmount = roundToFriendlyAmount(stretchAmount)
  targetAmount = roundToFriendlyAmount(targetAmount)
  accessibleAmount = roundToFriendlyAmount(accessibleAmount)

  // Ensure logical ordering (stretch >= target >= accessible)
  stretchAmount = Math.max(stretchAmount, targetAmount)
  targetAmount = Math.max(targetAmount, accessibleAmount)

  // Step 6: Calculate confidence scores
  const confidenceScores = calculateConfidenceScores(
    giftHistory,
    capacity,
    baseConfidence,
    lapseRisk
  )

  // Step 7: Generate reasoning
  const reasoning = generateReasoning(
    baseAmount,
    method,
    giftHistory,
    capacity,
    lapseRisk,
    riskAdjustment
  )

  return {
    stretchAmount,
    targetAmount,
    accessibleAmount,
    baseAmount,
    stretchConfidence: confidenceScores.stretch,
    targetConfidence: confidenceScores.target,
    accessibleConfidence: confidenceScores.accessible,
    reasoning,
    calculationMethod: method,
  }
}

/**
 * Determine the base amount from giving history
 */
function determineBaseAmount(history: DonorGiftHistory): {
  baseAmount: number
  method: string
  confidence: number
} {
  const { gifts, giftCount, lastGiftAmount, averageGiftAmount } = history

  // No giving history - use conservative default
  if (giftCount === 0 || !lastGiftAmount) {
    return {
      baseAmount: 50, // Default starter amount
      method: 'default',
      confidence: 0.3,
    }
  }

  // Single gift - use that gift as base
  if (giftCount === 1) {
    return {
      baseAmount: lastGiftAmount,
      method: 'last_gift',
      confidence: 0.6,
    }
  }

  // Multiple gifts - prefer average of last 3 gifts
  if (giftCount >= 3) {
    const last3Gifts = gifts
      .sort((a, b) => new Date(b.gift_date).getTime() - new Date(a.gift_date).getTime())
      .slice(0, 3)

    const last3Average = last3Gifts.reduce((sum, g) => sum + g.amount, 0) / last3Gifts.length

    return {
      baseAmount: last3Average,
      method: 'average_3_gifts',
      confidence: 0.85,
    }
  }

  // 2 gifts - use average
  if (averageGiftAmount) {
    return {
      baseAmount: averageGiftAmount,
      method: 'average_all_gifts',
      confidence: 0.75,
    }
  }

  // Fallback to last gift
  return {
    baseAmount: lastGiftAmount,
    method: 'last_gift',
    confidence: 0.6,
  }
}

/**
 * Calculate capacity factor (0 to 1) from giving potential scores
 */
function calculateCapacityFactor(capacity: DonorCapacity): number {
  const { capacity_score, affinity_score, propensity_score } = capacity

  // No capacity data
  if (!capacity_score && !affinity_score && !propensity_score) {
    return 0
  }

  // Weight capacity most heavily, then propensity, then affinity
  const capacityValue = (capacity_score || 0) / 100
  const affinityValue = (affinity_score || 0) / 100
  const propensityValue = (propensity_score || 0) / 100

  // Weighted average: capacity 60%, propensity 25%, affinity 15%
  const weightedScore = capacityValue * 0.6 + propensityValue * 0.25 + affinityValue * 0.15

  return weightedScore
}

/**
 * Calculate confidence scores for each suggestion tier
 */
function calculateConfidenceScores(
  history: DonorGiftHistory,
  capacity: DonorCapacity,
  baseConfidence: number,
  lapseRisk: 'low' | 'medium' | 'high' | 'unknown'
): {
  stretch: number
  target: number
  accessible: number
} {
  let accessibleConfidence = baseConfidence
  let targetConfidence = baseConfidence * 0.85
  let stretchConfidence = baseConfidence * 0.7

  // Boost confidence if we have capacity data
  const hasCapacityData = !!(capacity.capacity_score || capacity.propensity_score)
  if (hasCapacityData) {
    accessibleConfidence = Math.min(1.0, accessibleConfidence + 0.1)
    targetConfidence = Math.min(1.0, targetConfidence + 0.1)
    stretchConfidence = Math.min(1.0, stretchConfidence + 0.15)
  }

  // Reduce confidence for at-risk donors
  if (lapseRisk === 'high') {
    accessibleConfidence *= 0.8
    targetConfidence *= 0.7
    stretchConfidence *= 0.5
  } else if (lapseRisk === 'medium') {
    targetConfidence *= 0.9
    stretchConfidence *= 0.8
  }

  // Ensure confidence is between 0 and 1
  return {
    stretch: Math.max(0, Math.min(1, stretchConfidence)),
    target: Math.max(0, Math.min(1, targetConfidence)),
    accessible: Math.max(0, Math.min(1, accessibleConfidence)),
  }
}

/**
 * Round amounts to friendly, psychologically effective values
 */
function roundToFriendlyAmount(amount: number): number {
  if (amount < 10) return Math.ceil(amount)
  if (amount < 20) return Math.ceil(amount / 5) * 5 // Round to nearest $5
  if (amount < 50) return Math.ceil(amount / 10) * 10 // Round to nearest $10
  if (amount < 100) return Math.ceil(amount / 25) * 25 // Round to nearest $25
  if (amount < 500) return Math.ceil(amount / 50) * 50 // Round to nearest $50
  if (amount < 1000) return Math.ceil(amount / 100) * 100 // Round to nearest $100
  if (amount < 5000) return Math.ceil(amount / 250) * 250 // Round to nearest $250
  if (amount < 10000) return Math.ceil(amount / 500) * 500 // Round to nearest $500
  return Math.ceil(amount / 1000) * 1000 // Round to nearest $1000
}

/**
 * Generate human-readable reasoning for the suggestion
 */
function generateReasoning(
  baseAmount: number,
  method: string,
  history: DonorGiftHistory,
  capacity: DonorCapacity,
  lapseRisk: 'low' | 'medium' | 'high' | 'unknown',
  riskAdjustment: number
): string {
  const parts: string[] = []

  // Base amount reasoning
  if (method === 'average_3_gifts') {
    parts.push(
      `Based on average of last 3 gifts ($${Math.round(baseAmount)})`
    )
  } else if (method === 'average_all_gifts') {
    parts.push(
      `Based on average of ${history.giftCount} gifts ($${Math.round(baseAmount)})`
    )
  } else if (method === 'last_gift') {
    parts.push(`Based on last gift of $${Math.round(baseAmount)}`)
  } else {
    parts.push('New donor - using standard starting amount')
  }

  // Capacity factor
  const hasCapacity = !!(capacity.capacity_score || capacity.propensity_score)
  if (hasCapacity) {
    if (capacity.capacity_score && capacity.capacity_score > 70) {
      parts.push('Adjusted upward based on strong giving capacity')
    } else if (capacity.capacity_score && capacity.capacity_score > 40) {
      parts.push('Adjusted based on moderate giving capacity')
    }
  }

  // Risk adjustment
  if (riskAdjustment < 1.0) {
    const reduction = Math.round((1.0 - riskAdjustment) * 100)
    parts.push(
      `Reduced ${reduction}% due to ${lapseRisk} lapse risk - prioritizing re-engagement over ask size`
    )
  }

  // Gift history context
  if (history.giftCount > 5) {
    parts.push(`Loyal donor with ${history.giftCount} gifts`)
  } else if (history.giftCount > 1) {
    parts.push(`Repeat donor with ${history.giftCount} gifts`)
  }

  return parts.join('. ') + '.'
}

/**
 * Helper to get suggested amounts as an array
 */
export function getSuggestedAmountsArray(result: SmartAskResult): number[] {
  return [result.accessibleAmount, result.targetAmount, result.stretchAmount]
}

/**
 * Helper to format amount with currency
 */
export function formatSmartAskAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
