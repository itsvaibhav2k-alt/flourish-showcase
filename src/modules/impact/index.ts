/**
 * Impact Module
 *
 * Provides functionality for:
 * - Managing program metrics (cost per unit for different programs)
 * - Generating personalized impact stories for donors
 * - Calculating impact breakdown based on giving history
 * - Public sharing of impact stories
 */

// Schemas
export * from './schemas/impact.schema'

// Queries
export {
  getProgramMetrics,
  getProgramMetricsGrouped,
  getAvailableTimePeriods,
  type ProgramMetricData,
} from './queries/get-program-metrics'

export {
  getImpactStory,
  getImpactStoryByToken,
  getImpactStoriesForContact,
  hasImpactStory,
  type ImpactStoryData,
  type ImpactStoryWithDetails,
} from './queries/get-impact-story'

// Actions
export {
  saveProgramMetric,
  deleteProgramMetric,
  type SaveProgramMetricResult,
} from './actions/save-program-metrics'

export {
  generateImpactStory,
  deleteImpactStory,
  type GenerateImpactStoryResult,
} from './actions/generate-impact-story'

// Services
export {
  calculateImpact,
  calculateImpactEvenly,
  formatImpactForDisplay,
  calculateTotalImpactUnits,
  type ProgramMetric,
  type ImpactBreakdown,
} from './services/impact-calculator'
