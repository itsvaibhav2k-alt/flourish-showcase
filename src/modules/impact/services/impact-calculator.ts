/**
 * Impact Calculator Service
 *
 * Calculates the impact breakdown for a donor based on their total giving
 * and the organization's program metrics.
 */

export interface ProgramMetric {
  program_name: string
  metric_name: string
  cost_per_unit: number
  icon?: string | null
}

export interface ImpactBreakdown {
  [metricKey: string]: {
    program_name: string
    metric_name: string
    count: number
    icon?: string | null
  }
}

/**
 * Calculate impact breakdown from total giving and program metrics
 *
 * Allocates the donor's total giving proportionally across all programs
 * based on their cost per unit, and calculates how many units were funded.
 *
 * @param totalGiving - Total amount donated by the contact
 * @param metrics - Array of program metrics with cost per unit
 * @returns Impact breakdown showing units funded per metric
 */
export function calculateImpact(
  totalGiving: number,
  metrics: ProgramMetric[]
): ImpactBreakdown {
  if (totalGiving <= 0 || metrics.length === 0) {
    return {}
  }

  const breakdown: ImpactBreakdown = {}

  // Calculate total cost across all metrics (sum of all cost_per_unit)
  const totalCost = metrics.reduce((sum, metric) => sum + metric.cost_per_unit, 0)

  if (totalCost <= 0) {
    return {}
  }

  // Allocate giving proportionally to each metric
  metrics.forEach((metric) => {
    // Calculate this metric's share of the total giving
    const proportion = metric.cost_per_unit / totalCost
    const allocatedAmount = totalGiving * proportion

    // Calculate how many units this amount funds
    const unitsFunded = Math.floor(allocatedAmount / metric.cost_per_unit)

    if (unitsFunded > 0) {
      // Create a unique key for this metric
      const metricKey = `${metric.program_name.toLowerCase().replace(/\s+/g, '_')}_${metric.metric_name.toLowerCase().replace(/\s+/g, '_')}`

      breakdown[metricKey] = {
        program_name: metric.program_name,
        metric_name: metric.metric_name,
        count: unitsFunded,
        icon: metric.icon,
      }
    }
  })

  return breakdown
}

/**
 * Alternative calculation method that distributes giving evenly across programs
 * instead of proportionally by cost.
 *
 * This approach gives each program an equal share of the donation,
 * which may be more appropriate for some organizations.
 *
 * @param totalGiving - Total amount donated by the contact
 * @param metrics - Array of program metrics with cost per unit
 * @returns Impact breakdown showing units funded per metric
 */
export function calculateImpactEvenly(
  totalGiving: number,
  metrics: ProgramMetric[]
): ImpactBreakdown {
  if (totalGiving <= 0 || metrics.length === 0) {
    return {}
  }

  const breakdown: ImpactBreakdown = {}

  // Divide giving evenly across all metrics
  const amountPerMetric = totalGiving / metrics.length

  metrics.forEach((metric) => {
    // Calculate how many units this amount funds
    const unitsFunded = Math.floor(amountPerMetric / metric.cost_per_unit)

    if (unitsFunded > 0) {
      const metricKey = `${metric.program_name.toLowerCase().replace(/\s+/g, '_')}_${metric.metric_name.toLowerCase().replace(/\s+/g, '_')}`

      breakdown[metricKey] = {
        program_name: metric.program_name,
        metric_name: metric.metric_name,
        count: unitsFunded,
        icon: metric.icon,
      }
    }
  })

  return breakdown
}

/**
 * Format impact breakdown for display in narrative
 *
 * Converts the breakdown object into a human-readable list
 *
 * @param breakdown - Impact breakdown object
 * @returns Array of formatted strings
 */
export function formatImpactForDisplay(breakdown: ImpactBreakdown): string[] {
  return Object.values(breakdown).map((item) => {
    const icon = item.icon ? `${item.icon} ` : ''
    return `${icon}${item.count} ${item.metric_name} (${item.program_name})`
  })
}

/**
 * Calculate total impact units across all metrics
 *
 * @param breakdown - Impact breakdown object
 * @returns Total number of units funded across all programs
 */
export function calculateTotalImpactUnits(breakdown: ImpactBreakdown): number {
  return Object.values(breakdown).reduce((sum, item) => sum + item.count, 0)
}
