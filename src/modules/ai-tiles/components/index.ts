/**
 * AI Tiles Components
 *
 * Export all AI tile components for easy importing
 */

export { AITileCard } from './ai-tile-card'
export { AITileSkeleton } from './ai-tile-skeleton'
export { DonorHealthTile } from './donor-health-tile'
export { WeeklyPrioritiesTile } from './weekly-priorities-tile'
export { OrgPulseTile } from './org-pulse-tile'
export { CustomTile } from './custom-tile'
export { TileGrid, SimpleTileGrid } from './tile-grid'
export { CustomTileBuilder } from './custom-tile-builder'

// Export types
export type {
  AtRiskDonor,
  GivingTrend,
  DonorHealthInsight,
} from './donor-health-tile'

export type {
  PriorityContact,
  QuickWin,
  WeeklyPrioritiesInsight,
} from './weekly-priorities-tile'

export type {
  KeyMetric,
  Alert,
  Opportunity,
  OrgPulseInsight,
} from './org-pulse-tile'

export type {
  CustomInsightData,
  CustomInsight,
} from './custom-tile'

export type {
  TileConfig,
} from './tile-grid'

export type {
  CustomAITile,
} from './custom-tile-builder'
