/**
 * Score Calculator Service
 *
 * Pure functions for calculating giving potential scores.
 * All scores are on a 0-100 scale.
 *
 * Scoring algorithm:
 * - Capacity: Real estate (40%), Stocks (30%), Job level (20%), Political donations (10%)
 * - Affinity: Lifetime giving relative to capacity (40%), Volunteer hours (30%), Email opens (20%), Event attendance (10%)
 * - Propensity: Recency of last gift (40%), Frequency (30%), Gift growth trend (30%)
 * - Overall: Capacity (40%) + Affinity (30%) + Propensity (30%)
 */

import type { WealthData, ContactEngagement } from '../schemas/giving-potential.schema'

// Thresholds for scoring (adjust based on your nonprofit's context)
const CAPACITY_THRESHOLDS = {
  REAL_ESTATE_MAX: 5_000_000, // $5M+
  STOCKS_MAX: 2_000_000, // $2M+
  POLITICAL_MAX: 50_000, // $50k+
}

const AFFINITY_THRESHOLDS = {
  VOLUNTEER_HOURS_MAX: 200, // 200+ hours = max score
  EMAIL_OPEN_RATE_MIN: 0.5, // 50%+ open rate
  EVENT_ATTENDANCE_MAX: 10, // 10+ events
}

const PROPENSITY_THRESHOLDS = {
  RECENCY_MAX_DAYS: 365, // More recent than 1 year = high score
  FREQUENCY_MAX: 12, // 12+ gifts per year = max score
}

/**
 * Calculate capacity score based on wealth indicators
 * Weights: Real estate (40%), Stocks (30%), Job level (20%), Political donations (10%)
 */
export function calculateCapacityScore(data: WealthData): number {
  let score = 0

  // Real estate value (40% weight)
  if (data.real_estate_value !== undefined) {
    const realEstateScore = Math.min(
      100,
      (data.real_estate_value / CAPACITY_THRESHOLDS.REAL_ESTATE_MAX) * 100
    )
    score += realEstateScore * 0.4
  }

  // Stock holdings (30% weight)
  if (data.stock_holdings !== undefined) {
    const stockScore = Math.min(
      100,
      (data.stock_holdings / CAPACITY_THRESHOLDS.STOCKS_MAX) * 100
    )
    score += stockScore * 0.3
  }

  // Job level (20% weight)
  if (data.job_level !== undefined) {
    const jobLevelScores: Record<string, number> = {
      'entry': 20,
      'mid': 40,
      'senior': 60,
      'executive': 80,
      'c-suite': 100,
    }
    score += jobLevelScores[data.job_level] * 0.2
  }

  // Political donations (10% weight)
  if (data.political_donations !== undefined) {
    const politicalScore = Math.min(
      100,
      (data.political_donations / CAPACITY_THRESHOLDS.POLITICAL_MAX) * 100
    )
    score += politicalScore * 0.1
  }

  return Math.round(Math.min(100, score))
}

/**
 * Calculate affinity score based on engagement with the organization
 * Weights: Lifetime giving relative to capacity (40%), Volunteer hours (30%), Email opens (20%), Event attendance (10%)
 */
export function calculateAffinityScore(
  contactData: ContactEngagement,
  estimatedCapacity?: number
): number {
  let score = 0
  let totalWeight = 0

  // Lifetime giving relative to capacity (40% weight)
  if (contactData.lifetime_giving !== undefined && contactData.lifetime_giving > 0) {
    if (estimatedCapacity && estimatedCapacity > 0) {
      // Calculate giving as percentage of capacity
      const givingRatio = contactData.lifetime_giving / estimatedCapacity
      const givingScore = Math.min(100, givingRatio * 1000) // 10% of capacity = max score
      score += givingScore * 0.4
    } else {
      // No capacity data - use absolute giving amount (normalized to $50k max)
      const givingScore = Math.min(100, (contactData.lifetime_giving / 50_000) * 100)
      score += givingScore * 0.4
    }
    totalWeight += 0.4
  }

  // Volunteer hours (30% weight)
  if (contactData.total_volunteer_hours !== undefined && contactData.total_volunteer_hours > 0) {
    const volunteerScore = Math.min(
      100,
      (contactData.total_volunteer_hours / AFFINITY_THRESHOLDS.VOLUNTEER_HOURS_MAX) * 100
    )
    score += volunteerScore * 0.3
    totalWeight += 0.3
  }

  // Email engagement (20% weight)
  if (contactData.email_open_rate !== undefined) {
    const emailScore = Math.min(
      100,
      (contactData.email_open_rate / AFFINITY_THRESHOLDS.EMAIL_OPEN_RATE_MIN) * 100
    )
    score += emailScore * 0.2
    totalWeight += 0.2
  }

  // Event attendance (10% weight)
  if (contactData.event_attendance_count !== undefined && contactData.event_attendance_count > 0) {
    const eventScore = Math.min(
      100,
      (contactData.event_attendance_count / AFFINITY_THRESHOLDS.EVENT_ATTENDANCE_MAX) * 100
    )
    score += eventScore * 0.1
    totalWeight += 0.1
  }

  // If we have no data, return 0
  if (totalWeight === 0) {
    return 0
  }

  // Normalize score based on available data
  const normalizedScore = score / totalWeight * (totalWeight / 1.0)

  return Math.round(Math.min(100, normalizedScore))
}

/**
 * Calculate propensity score based on giving behavior
 * Weights: Recency of last gift (40%), Frequency (30%), Gift growth trend (30%)
 */
export function calculatePropensityScore(contactData: ContactEngagement): number {
  let score = 0
  let totalWeight = 0

  // Recency of last gift (40% weight)
  if (contactData.last_gift_date) {
    const lastGiftDate = new Date(contactData.last_gift_date)
    const daysSinceLastGift = Math.floor(
      (Date.now() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // More recent = higher score
    const recencyScore = Math.max(
      0,
      100 - (daysSinceLastGift / PROPENSITY_THRESHOLDS.RECENCY_MAX_DAYS) * 100
    )
    score += recencyScore * 0.4
    totalWeight += 0.4
  }

  // Frequency (30% weight)
  if (
    contactData.gift_count !== undefined &&
    contactData.gift_count > 0 &&
    contactData.first_gift_date &&
    contactData.last_gift_date
  ) {
    const firstGiftDate = new Date(contactData.first_gift_date)
    const lastGiftDate = new Date(contactData.last_gift_date)
    const daysBetween = Math.floor(
      (lastGiftDate.getTime() - firstGiftDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const yearsBetween = Math.max(1, daysBetween / 365)
    const giftsPerYear = contactData.gift_count / yearsBetween

    const frequencyScore = Math.min(
      100,
      (giftsPerYear / PROPENSITY_THRESHOLDS.FREQUENCY_MAX) * 100
    )
    score += frequencyScore * 0.3
    totalWeight += 0.3
  }

  // Gift growth trend (30% weight)
  // For this we need avg_gift_amount and recent giving trend
  // If we have multiple gifts, assume growth if they're giving regularly
  if (
    contactData.gift_count !== undefined &&
    contactData.gift_count >= 2 &&
    contactData.avg_gift_amount !== undefined
  ) {
    // Simple heuristic: if gift count is increasing and avg gift is reasonable
    // More sophisticated: compare first half vs second half of gifts (would need more data)

    // For now, use gift count and average amount as proxy for growth
    const giftCountScore = Math.min(100, (contactData.gift_count / 10) * 100) // 10+ gifts = max
    const avgAmountScore = Math.min(100, (contactData.avg_gift_amount / 500) * 100) // $500+ avg = max

    const growthScore = (giftCountScore + avgAmountScore) / 2
    score += growthScore * 0.3
    totalWeight += 0.3
  }

  // If no data, return 0
  if (totalWeight === 0) {
    return 0
  }

  // Normalize score based on available data
  const normalizedScore = score / totalWeight * (totalWeight / 1.0)

  return Math.round(Math.min(100, normalizedScore))
}

/**
 * Calculate overall score as weighted average
 * Weights: Capacity (40%) + Affinity (30%) + Propensity (30%)
 */
export function calculateOverallScore(
  capacity: number,
  affinity: number,
  propensity: number
): number {
  const score = capacity * 0.4 + affinity * 0.3 + propensity * 0.3
  return Math.round(Math.min(100, score))
}

/**
 * Calculate giving gap ratio
 * Lower ratio = more potential (they're giving less than their capacity suggests)
 */
export function calculateGivingGapRatio(
  lifetimeGiving: number,
  estimatedCapacity: number
): number | null {
  if (estimatedCapacity <= 0) {
    return null
  }

  return lifetimeGiving / estimatedCapacity
}

/**
 * Get a human-readable description of capacity score
 */
export function getCapacityDescription(score: number): string {
  if (score >= 80) return 'Very High - Major gift prospect'
  if (score >= 60) return 'High - Significant capacity'
  if (score >= 40) return 'Medium - Moderate capacity'
  if (score >= 20) return 'Low - Limited capacity'
  return 'Minimal - Unknown or very limited capacity'
}

/**
 * Get a human-readable description of affinity score
 */
export function getAffinityDescription(score: number): string {
  if (score >= 80) return 'Very High - Deeply engaged with mission'
  if (score >= 60) return 'High - Strong connection'
  if (score >= 40) return 'Medium - Moderate engagement'
  if (score >= 20) return 'Low - Limited engagement'
  return 'Minimal - Little to no engagement'
}

/**
 * Get a human-readable description of propensity score
 */
export function getPropensityDescription(score: number): string {
  if (score >= 80) return 'Very High - Active and growing giving'
  if (score >= 60) return 'High - Regular giving pattern'
  if (score >= 40) return 'Medium - Occasional giving'
  if (score >= 20) return 'Low - Infrequent giving'
  return 'Minimal - Lapsed or one-time donor'
}

/**
 * Get a human-readable description of overall score
 */
export function getOverallDescription(score: number): string {
  if (score >= 80) return 'Top Prospect - High capacity, affinity, and propensity'
  if (score >= 60) return 'Strong Prospect - Good potential for major gift'
  if (score >= 40) return 'Moderate Prospect - Worth cultivation'
  if (score >= 20) return 'Emerging Prospect - Build relationship'
  return 'Low Priority - Focus on higher-scoring prospects'
}
