/**
 * AI Tile Registry
 *
 * Defines built-in AI-powered dashboard tiles that can be enabled/disabled.
 * Each tile provides AI-generated insights based on organizational data.
 */

import { Heart, ListTodo, Activity, LucideIcon } from 'lucide-react'

export type BuiltInTileId = 'donor-health' | 'weekly-priorities' | 'org-pulse'

export type DataSource =
  | 'donors'
  | 'volunteers'
  | 'gifts'
  | 'contacts'
  | 'communications'
  | 'tasks'
  | 'shifts'

export interface AITileDefinition {
  id: BuiltInTileId
  name: string
  description: string
  icon: LucideIcon
  refreshSchedule: 'daily' | 'weekly'
  dataSources: DataSource[]
  defaultEnabled: boolean
}

/**
 * Registry of built-in AI tile definitions
 */
export const AI_TILE_DEFINITIONS: Record<BuiltInTileId, AITileDefinition> = {
  'donor-health': {
    id: 'donor-health',
    name: 'Donor Health Scores',
    description:
      'AI-predicted lapse risk, giving trajectory, and optimal ask amounts for each donor',
    icon: Heart,
    refreshSchedule: 'daily',
    dataSources: ['donors', 'gifts', 'contacts'],
    defaultEnabled: true,
  },
  'weekly-priorities': {
    id: 'weekly-priorities',
    name: 'Weekly Priorities',
    description:
      'AI-curated list of top actions to take this week based on donor engagement and deadlines',
    icon: ListTodo,
    refreshSchedule: 'weekly',
    dataSources: ['donors', 'volunteers', 'tasks', 'communications'],
    defaultEnabled: true,
  },
  'org-pulse': {
    id: 'org-pulse',
    name: 'Organization Pulse',
    description:
      'AI summary of overall organizational health, trends, and areas needing attention',
    icon: Activity,
    refreshSchedule: 'daily',
    dataSources: ['donors', 'volunteers', 'gifts', 'contacts', 'communications', 'shifts'],
    defaultEnabled: true,
  },
}

/**
 * Get a specific AI tile definition by ID
 */
export function getAITileDefinition(
  id: BuiltInTileId
): AITileDefinition | undefined {
  return AI_TILE_DEFINITIONS[id]
}

/**
 * Get all built-in AI tile definitions
 */
export function getAllAITiles(): AITileDefinition[] {
  return Object.values(AI_TILE_DEFINITIONS)
}

/**
 * Get AI tiles filtered by refresh schedule
 */
export function getAITilesBySchedule(
  schedule: 'daily' | 'weekly'
): AITileDefinition[] {
  return getAllAITiles().filter((tile) => tile.refreshSchedule === schedule)
}

/**
 * Check if a tile ID is valid
 */
export function isValidAITileId(id: string): id is BuiltInTileId {
  return id in AI_TILE_DEFINITIONS
}

/**
 * Custom AI Tile Type
 * For user-created tiles with custom prompts
 */
export interface CustomAITile {
  id: string // UUID
  organizationId: string
  name: string
  description: string
  prompt: string // User-defined prompt for Claude
  refreshSchedule: 'daily' | 'weekly' | 'manual'
  dataSources: DataSource[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}
