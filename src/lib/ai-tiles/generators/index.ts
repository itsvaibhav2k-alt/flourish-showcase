/**
 * AI Tile Generators
 *
 * Re-export all tile generator functions.
 */

export {
  generateDonorHealthInsights,
  type DonorHealthInsight,
} from './donor-health'

export {
  generateWeeklyPrioritiesInsights,
  type WeeklyPrioritiesInsight,
} from './weekly-priorities'

export {
  generateOrgPulseInsights,
  type OrgPulseInsight,
} from './org-pulse'

export {
  generateCustomTileInsights,
  validateCustomPrompt,
  getSuggestedCustomPrompts,
  type CustomTileInsight,
} from './custom'
