/**
 * Readiness Calculator Service
 *
 * Pure functions for calculating prospect readiness scores.
 * All scores are on a 0-100 scale.
 *
 * Readiness algorithm considers:
 * - Number of cultivation moves (30%)
 * - Recency of last move (25%)
 * - Stage duration (20%)
 * - Move quality/diversity (15%)
 * - Response indicators (10%)
 *
 * Higher scores indicate the prospect is more ready for the ask.
 */

import type { Stage, MoveType } from '../schemas/pipeline.schema'

export interface ProspectData {
  stage: Stage
  stage_entered_at: string
  target_ask_amount?: number | null
  readiness_score?: number | null
}

export interface MoveData {
  move_type: MoveType
  move_date: string
  outcome?: string | null
}

export interface ReadinessCalculation {
  score: number
  recommendation: string
  factors: {
    move_count_score: number
    recency_score: number
    stage_duration_score: number
    move_quality_score: number
    response_score: number
  }
}

// Thresholds for scoring
const READINESS_THRESHOLDS = {
  OPTIMAL_MOVES_IDENTIFICATION: 3,
  OPTIMAL_MOVES_QUALIFICATION: 5,
  OPTIMAL_MOVES_CULTIVATION: 8,
  OPTIMAL_MOVES_SOLICITATION: 2,
  OPTIMAL_MOVES_STEWARDSHIP: 4,
  RECENCY_MAX_DAYS: 30, // Within 30 days = high score
  STAGE_DURATION_SWEET_SPOT_DAYS: 90, // ~3 months in stage = optimal
  MIN_MOVE_TYPES: 3, // Diversity of interaction types
}

/**
 * Calculate readiness score for a prospect based on their data and cultivation moves
 */
export function calculateReadinessScore(
  prospect: ProspectData,
  moves: MoveData[]
): ReadinessCalculation {
  const moveCountScore = calculateMoveCountScore(prospect.stage, moves.length)
  const recencyScore = calculateRecencyScore(moves)
  const stageDurationScore = calculateStageDurationScore(prospect.stage, prospect.stage_entered_at)
  const moveQualityScore = calculateMoveQualityScore(moves)
  const responseScore = calculateResponseScore(moves)

  // Weighted average
  const score = Math.round(
    moveCountScore * 0.3 +
    recencyScore * 0.25 +
    stageDurationScore * 0.2 +
    moveQualityScore * 0.15 +
    responseScore * 0.1
  )

  const recommendation = getRecommendation(score, prospect.stage, moves)

  return {
    score,
    recommendation,
    factors: {
      move_count_score: moveCountScore,
      recency_score: recencyScore,
      stage_duration_score: stageDurationScore,
      move_quality_score: moveQualityScore,
      response_score: responseScore,
    },
  }
}

/**
 * Calculate score based on number of moves relative to stage
 */
function calculateMoveCountScore(stage: Stage, moveCount: number): number {
  const optimalMoves = getOptimalMoveCount(stage)

  if (moveCount === 0) {
    return 0
  }

  // Score peaks at optimal count
  const ratio = moveCount / optimalMoves
  if (ratio >= 1) {
    return 100
  }

  return Math.round(ratio * 100)
}

/**
 * Get optimal move count for a stage
 */
function getOptimalMoveCount(stage: Stage): number {
  switch (stage) {
    case 'identification':
      return READINESS_THRESHOLDS.OPTIMAL_MOVES_IDENTIFICATION
    case 'qualification':
      return READINESS_THRESHOLDS.OPTIMAL_MOVES_QUALIFICATION
    case 'cultivation':
      return READINESS_THRESHOLDS.OPTIMAL_MOVES_CULTIVATION
    case 'solicitation':
      return READINESS_THRESHOLDS.OPTIMAL_MOVES_SOLICITATION
    case 'stewardship':
      return READINESS_THRESHOLDS.OPTIMAL_MOVES_STEWARDSHIP
    default:
      return 5
  }
}

/**
 * Calculate score based on recency of last move
 */
function calculateRecencyScore(moves: MoveData[]): number {
  if (moves.length === 0) {
    return 0
  }

  // Find most recent move
  const sortedMoves = [...moves].sort(
    (a, b) => new Date(b.move_date).getTime() - new Date(a.move_date).getTime()
  )
  const lastMoveDate = new Date(sortedMoves[0].move_date)
  const daysSinceLastMove = Math.floor(
    (Date.now() - lastMoveDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // More recent = higher score
  if (daysSinceLastMove <= READINESS_THRESHOLDS.RECENCY_MAX_DAYS) {
    return 100
  }

  // Decay over time (50% score at 90 days, approaches 0 at 365 days)
  const score = Math.max(0, 100 - (daysSinceLastMove - 30) * 0.8)
  return Math.round(score)
}

/**
 * Calculate score based on time in current stage
 * Too short = not ready, too long = stalled, sweet spot = high score
 */
function calculateStageDurationScore(stage: Stage, stageEnteredAt: string): number {
  const daysInStage = Math.floor(
    (Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const sweetSpot = READINESS_THRESHOLDS.STAGE_DURATION_SWEET_SPOT_DAYS

  if (stage === 'identification') {
    // Identification should be quick
    if (daysInStage < 30) return 100
    if (daysInStage < 60) return 80
    return Math.max(20, 100 - daysInStage)
  }

  if (stage === 'qualification') {
    // Qualification should take time but not too long
    if (daysInStage < 30) return 60 // Too soon
    if (daysInStage >= 60 && daysInStage <= 120) return 100 // Sweet spot
    if (daysInStage > 120) return Math.max(30, 100 - (daysInStage - 120) * 0.5)
    return 80
  }

  if (stage === 'cultivation') {
    // Cultivation is longest stage
    if (daysInStage < 60) return 50 // Too soon
    if (daysInStage >= 90 && daysInStage <= 180) return 100 // Sweet spot
    if (daysInStage > 180) return Math.max(40, 100 - (daysInStage - 180) * 0.3)
    return 75
  }

  if (stage === 'solicitation') {
    // Should move quickly through solicitation
    if (daysInStage < 30) return 100
    if (daysInStage < 60) return 80
    return Math.max(30, 100 - (daysInStage - 60) * 0.8)
  }

  if (stage === 'stewardship') {
    // Stewardship is ongoing
    return 80
  }

  return 50
}

/**
 * Calculate score based on quality and diversity of moves
 */
function calculateMoveQualityScore(moves: MoveData[]): number {
  if (moves.length === 0) {
    return 0
  }

  let score = 0

  // Diversity of move types (max 60 points)
  const uniqueMoveTypes = new Set(moves.map(m => m.move_type)).size
  const diversityScore = Math.min(60, (uniqueMoveTypes / READINESS_THRESHOLDS.MIN_MOVE_TYPES) * 60)
  score += diversityScore

  // High-value move types (max 40 points)
  const highValueMoves = moves.filter(m =>
    ['meeting', 'lunch', 'tour', 'proposal', 'event'].includes(m.move_type)
  ).length
  const highValueRatio = highValueMoves / moves.length
  score += highValueRatio * 40

  return Math.round(score)
}

/**
 * Calculate score based on response quality from outcomes
 */
function calculateResponseScore(moves: MoveData[]): number {
  if (moves.length === 0) {
    return 50 // Neutral if no data
  }

  const movesWithOutcomes = moves.filter(m => m.outcome)
  if (movesWithOutcomes.length === 0) {
    return 50 // Neutral if no outcomes tracked
  }

  // Look for positive indicators in outcomes
  const positiveKeywords = [
    'positive',
    'interested',
    'enthusiastic',
    'excited',
    'agreed',
    'yes',
    'committed',
    'ready',
  ]
  const negativeKeywords = [
    'negative',
    'hesitant',
    'unsure',
    'declined',
    'no',
    'not ready',
    'concerned',
  ]

  let positiveCount = 0
  let negativeCount = 0

  for (const move of movesWithOutcomes) {
    const outcome = (move.outcome || '').toLowerCase()
    if (positiveKeywords.some(kw => outcome.includes(kw))) {
      positiveCount++
    }
    if (negativeKeywords.some(kw => outcome.includes(kw))) {
      negativeCount++
    }
  }

  // Calculate ratio
  const totalScored = positiveCount + negativeCount
  if (totalScored === 0) {
    return 50 // Neutral
  }

  const positiveRatio = positiveCount / totalScored
  return Math.round(positiveRatio * 100)
}

/**
 * Get recommendation based on score and context
 */
function getRecommendation(
  score: number,
  stage: Stage,
  moves: MoveData[]
): string {
  if (score >= 80) {
    if (stage === 'cultivation') {
      return 'Ready to move to solicitation. Schedule a face-to-face meeting to present the ask.'
    }
    if (stage === 'qualification') {
      return 'Strong prospect. Move to cultivation and develop a personalized engagement plan.'
    }
    if (stage === 'solicitation') {
      return 'Timing is optimal. Make the ask at the next interaction.'
    }
    return 'Excellent engagement. Continue current strategy and monitor closely.'
  }

  if (score >= 60) {
    if (moves.length < getOptimalMoveCount(stage)) {
      return 'Good progress. Schedule 1-2 more touchpoints before advancing to next stage.'
    }
    return 'On track. Continue cultivation efforts and deepen the relationship.'
  }

  if (score >= 40) {
    if (moves.length === 0) {
      return 'No moves logged yet. Schedule an initial discovery call or meeting.'
    }
    const daysSinceLastMove = moves.length > 0
      ? Math.floor((Date.now() - new Date([...moves].sort(
          (a, b) => new Date(b.move_date).getTime() - new Date(a.move_date).getTime()
        )[0].move_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceLastMove > 60) {
      return 'Re-engage soon. It\'s been a while since the last touchpoint.'
    }
    return 'Moderate engagement. Increase frequency of touchpoints and vary interaction types.'
  }

  if (score >= 20) {
    return 'Low engagement. Consider if this prospect should remain in pipeline or be moved to watch list.'
  }

  return 'Minimal activity. Re-assess fit or develop a re-engagement strategy.'
}

/**
 * Get a human-readable description of readiness score
 */
export function getReadinessDescription(score: number): string {
  if (score >= 80) return 'High - Ready for next stage'
  if (score >= 60) return 'Medium-High - Continue cultivation'
  if (score >= 40) return 'Medium - Increase engagement'
  if (score >= 20) return 'Low - Re-assess strategy'
  return 'Very Low - Minimal activity'
}

/**
 * Get suggested next move types based on prospect data
 */
export function getSuggestedNextMoves(
  stage: Stage,
  moves: MoveData[]
): MoveType[] {
  const existingTypes = new Set(moves.map(m => m.move_type))

  if (stage === 'identification') {
    // Initial research moves
    if (!existingTypes.has('call')) return ['call', 'email']
    return ['meeting', 'email']
  }

  if (stage === 'qualification') {
    // Qualification moves
    if (!existingTypes.has('meeting')) return ['meeting', 'call']
    if (!existingTypes.has('tour')) return ['tour', 'event']
    return ['lunch', 'meeting']
  }

  if (stage === 'cultivation') {
    // Deeper engagement
    if (!existingTypes.has('lunch')) return ['lunch', 'tour']
    if (!existingTypes.has('event')) return ['event', 'meeting']
    return ['proposal', 'meeting']
  }

  if (stage === 'solicitation') {
    // The ask
    return ['meeting', 'proposal']
  }

  if (stage === 'stewardship') {
    // Post-gift cultivation
    return ['call', 'email', 'event']
  }

  return ['meeting', 'call']
}
