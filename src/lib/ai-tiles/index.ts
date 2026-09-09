/**
 * AI Tiles Module
 *
 * Centralized exports for AI tile functionality.
 */

// Registry exports
export {
  AI_TILE_DEFINITIONS,
  getAITileDefinition,
  getAllAITiles,
  getAITilesBySchedule,
  isValidAITileId,
} from './registry'
export type {
  BuiltInTileId,
  DataSource,
  AITileDefinition,
  CustomAITile,
} from './registry'

// Query exports
export {
  getEnabledAITiles,
  getCustomAITiles,
  getAITileCache,
  isAITileEnabled,
  getAllOrganizationAITiles,
} from './queries'

// Action exports
export {
  enableAITile,
  disableAITile,
  createCustomTile,
  updateCustomTile,
  deleteCustomTile,
  refreshTileCache,
} from './actions'

// Context Builder
export { buildTileContext, serializeTileContext } from './context-builder'
export type { TileContext } from './context-builder'

// Tile Generators
export {
  generateDonorHealthInsights,
  type DonorHealthInsight,
} from './generators/donor-health'

export {
  generateWeeklyPrioritiesInsights,
  type WeeklyPrioritiesInsight,
} from './generators/weekly-priorities'

export {
  generateOrgPulseInsights,
  type OrgPulseInsight,
} from './generators/org-pulse'

export {
  generateCustomTileInsights,
  validateCustomPrompt,
  getSuggestedCustomPrompts,
  type CustomTileInsight,
} from './generators/custom'
