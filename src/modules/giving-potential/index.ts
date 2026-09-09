/**
 * Giving Potential Module
 *
 * This module provides complete wealth screening and major gift prospect identification:
 * - Score calculation (capacity, affinity, propensity, overall)
 * - Prospect identification and ranking
 * - Giving potential tracking
 * - Integration with contact data for automated scoring
 */

// Schemas
export type {
  GivingPotential,
  CreateGivingPotentialInput,
  UpdateGivingPotentialInput,
  WealthData,
  ContactEngagement,
  CalculatedScores,
} from './schemas/giving-potential.schema'

// Queries
export { getGivingPotential, hasGivingPotential } from './queries/get-giving-potential'
export type { GivingPotentialData } from './queries/get-giving-potential'

export {
  getTopProspects,
  getHighCapacityProspects,
  getUntappedProspects,
} from './queries/get-top-prospects'
export type { TopProspect, GetTopProspectsOptions } from './queries/get-top-prospects'

// Actions
export {
  saveGivingPotential,
  deleteGivingPotential,
} from './actions/save-giving-potential'
export type { SaveGivingPotentialResult } from './actions/save-giving-potential'

export {
  calculateScores,
  calculateScoresForContact,
  recalculateAllScores,
} from './actions/calculate-scores'
export type { CalculateScoresInput, CalculateScoresResult } from './actions/calculate-scores'

// Services
export {
  calculateCapacityScore,
  calculateAffinityScore,
  calculatePropensityScore,
  calculateOverallScore,
  calculateGivingGapRatio,
  getCapacityDescription,
  getAffinityDescription,
  getPropensityDescription,
  getOverallDescription,
} from './services/score-calculator'

// Components
export { ContactGivingPotential } from './components/contact-giving-potential'
