export interface ReliabilityStats {
  totalShifts: number
  completedShifts: number
  noShowCount: number
}

/**
 * Calculates a reliability score for a volunteer based on their shift history.
 *
 * Score breakdown:
 * - Base score: completion rate (completed / total shifts) * 80 points
 * - Penalty: no-shows reduce score by 10 points each (up to -30)
 * - Bonus: 100% completion with 5+ shifts gets full 100 points
 *
 * @param stats - Volunteer statistics
 * @returns Reliability score from 0-100
 */
export function calculateReliabilityScore(stats: ReliabilityStats): number {
  const { totalShifts, completedShifts, noShowCount } = stats

  // New volunteers with no shifts get neutral score
  if (totalShifts === 0) {
    return 50
  }

  // Calculate base completion rate (0-80 points)
  const completionRate = completedShifts / totalShifts
  let score = completionRate * 80

  // Apply no-show penalty (max -30 points)
  const noShowPenalty = Math.min(noShowCount * 10, 30)
  score -= noShowPenalty

  // Bonus for perfect attendance with experience
  if (completionRate === 1 && totalShifts >= 5) {
    score = 100
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Gets a text label for a reliability score
 */
export function getReliabilityLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Very Good'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Improvement'
}

/**
 * Gets a color class for a reliability score
 */
export function getReliabilityColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}
