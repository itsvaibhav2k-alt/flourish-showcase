/**
 * AI Tiles Query Functions
 *
 * Functions for fetching enabled AI tiles, custom tiles, and cached tile content.
 */

import { createClient } from '@/lib/supabase/server'
import type { BuiltInTileId, CustomAITile, DataSource } from './registry'

export interface CachedTileData<T = unknown> {
  content: T
  generatedAt: string
  expiresAt?: string
}

export interface AllAITilesData {
  enabledBuiltIn: BuiltInTileId[]
  customTiles: CustomAITile[]
  cachedData: Record<string, CachedTileData>
}

/**
 * Get all AI tiles data in a single optimized query
 * This fetches enabled tiles, cached data, and custom tiles in parallel
 * with minimal database calls using indexed tables.
 *
 * @param organizationId - The organization ID
 * @returns All AI tiles data needed for the dashboard
 */
export async function getAllAITilesData(
  organizationId: string
): Promise<AllAITilesData> {
  const supabase = await createClient()

  // Fetch all data in parallel using indexed tables
  const [orgResult, customTilesResult, cacheResult] = await Promise.all([
    // Get organization settings for enabled tiles config (small JSONB query)
    supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single(),
    // Get custom tiles from dedicated indexed table
    supabase
      .from('custom_ai_tiles')
      .select('id, organization_id, name, description, prompt, refresh_schedule, data_sources, is_active, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    // Get cached data from dedicated indexed table (not from JSONB settings)
    supabase
      .from('ai_tile_cache')
      .select('tile_type, tile_id, data, created_at, expires_at')
      .eq('organization_id', organizationId)
      .gt('expires_at', new Date().toISOString()),
  ])

  // Parse organization settings for enabled tiles only
  const enabledBuiltIn: BuiltInTileId[] = []

  if (!orgResult.error && orgResult.data) {
    const settings = (orgResult.data.settings as Record<string, unknown>) || {}
    const aiTiles = (settings.ai_tiles as Record<string, unknown>) || {}
    for (const [tileId, config] of Object.entries(aiTiles)) {
      if (
        config &&
        typeof config === 'object' &&
        'enabled' in config &&
        config.enabled === true
      ) {
        enabledBuiltIn.push(tileId as BuiltInTileId)
      }
    }
  }

  // Parse cached data from ai_tile_cache table
  const cachedData: Record<string, CachedTileData> = {}
  if (!cacheResult.error && cacheResult.data) {
    for (const row of cacheResult.data) {
      // Build cache key: for built-in tiles use tile_id directly, for custom prefix with 'custom:'
      const cacheKey = row.tile_type === 'custom'
        ? `custom:${row.tile_id}`
        : row.tile_id || row.tile_type

      if (row.data && typeof row.data === 'object') {
        cachedData[cacheKey] = {
          content: row.data,
          generatedAt: row.created_at,
          expiresAt: row.expires_at,
        }
      }
    }
  }

  // Parse custom tiles
  let customTiles: CustomAITile[] = []
  if (!customTilesResult.error && customTilesResult.data) {
    customTiles = customTilesResult.data.map((tile) => ({
      id: tile.id,
      organizationId: tile.organization_id,
      name: tile.name,
      description: tile.description || '',
      prompt: tile.prompt,
      refreshSchedule: tile.refresh_schedule as 'daily' | 'weekly' | 'manual',
      dataSources: (tile.data_sources || []) as DataSource[],
      enabled: tile.is_active,
      createdAt: tile.created_at,
      updatedAt: tile.updated_at,
    }))
  }

  return {
    enabledBuiltIn,
    customTiles,
    cachedData,
  }
}

/**
 * Get all enabled built-in AI tile IDs for an organization
 *
 * @param organizationId - The organization ID
 * @returns Array of enabled AI tile IDs
 */
export async function getEnabledAITiles(
  organizationId: string
): Promise<BuiltInTileId[]> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    console.error('Failed to fetch organization settings:', error)
    return []
  }

  const settings = (org.settings as Record<string, unknown>) || {}
  const aiTiles = (settings.ai_tiles as Record<string, unknown>) || {}

  // Extract enabled tile IDs
  const enabledTiles: BuiltInTileId[] = []
  for (const [tileId, config] of Object.entries(aiTiles)) {
    if (
      config &&
      typeof config === 'object' &&
      'enabled' in config &&
      config.enabled === true
    ) {
      enabledTiles.push(tileId as BuiltInTileId)
    }
  }

  return enabledTiles
}

/**
 * Get all custom AI tiles for an organization
 * Custom tiles are stored in a dedicated table (would need migration)
 *
 * @param organizationId - The organization ID
 * @returns Array of custom AI tiles
 */
export async function getCustomAITiles(
  organizationId: string
): Promise<CustomAITile[]> {
  const supabase = await createClient()

  // Note: This assumes a 'custom_ai_tiles' table exists
  // This table would need to be created in a migration
  const { data: tiles, error } = await supabase
    .from('custom_ai_tiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    // If table doesn't exist yet, return empty array
    if (error.code === '42P01') {
      console.warn('custom_ai_tiles table does not exist yet')
      return []
    }
    console.error('Failed to fetch custom AI tiles:', error)
    return []
  }

  // Transform database columns (snake_case) to TypeScript interface (camelCase)
  return (tiles || []).map((tile) => ({
    id: tile.id,
    organizationId: tile.organization_id,
    name: tile.name,
    description: tile.description || '',
    prompt: tile.prompt,
    refreshSchedule: tile.refresh_schedule as 'daily' | 'weekly' | 'manual',
    dataSources: (tile.data_sources || []) as DataSource[],
    enabled: tile.is_active,
    createdAt: tile.created_at,
    updatedAt: tile.updated_at,
  }))
}

/**
 * Get cached AI tile content
 * Cache is stored in organization settings with timestamp
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile ('built-in' or 'custom')
 * @param tileId - The tile ID (BuiltInTileId or custom UUID)
 * @returns Cached content object or null if not found
 */
export async function getAITileCache(
  organizationId: string,
  tileType: 'built-in' | 'custom',
  tileId?: string
): Promise<{
  content: string
  generatedAt: string
  expiresAt?: string
} | null> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    console.error('Failed to fetch organization settings:', error)
    return null
  }

  const settings = (org.settings as Record<string, unknown>) || {}
  const aiTileCache = (settings.ai_tile_cache as Record<string, unknown>) || {}

  if (!tileId) {
    return null
  }

  const cacheKey = `${tileType}:${tileId}`
  const cached = aiTileCache[cacheKey]

  if (!cached || typeof cached !== 'object') {
    return null
  }

  // Type assertion with validation
  if (
    'content' in cached &&
    'generatedAt' in cached &&
    typeof cached.content === 'string' &&
    typeof cached.generatedAt === 'string'
  ) {
    return {
      content: cached.content,
      generatedAt: cached.generatedAt,
      expiresAt:
        'expiresAt' in cached && typeof cached.expiresAt === 'string'
          ? cached.expiresAt
          : undefined,
    }
  }

  return null
}

/**
 * Check if a built-in AI tile is enabled
 *
 * @param organizationId - The organization ID
 * @param tileId - The built-in tile ID to check
 * @returns True if the tile is enabled, false otherwise
 */
export async function isAITileEnabled(
  organizationId: string,
  tileId: BuiltInTileId
): Promise<boolean> {
  const enabledTiles = await getEnabledAITiles(organizationId)
  return enabledTiles.includes(tileId)
}

/**
 * Get all AI tiles (built-in + custom) for an organization
 *
 * @param organizationId - The organization ID
 * @returns Object with enabled built-in tiles and custom tiles
 */
export async function getAllOrganizationAITiles(organizationId: string): Promise<{
  builtIn: BuiltInTileId[]
  custom: CustomAITile[]
}> {
  const [builtInTiles, customTiles] = await Promise.all([
    getEnabledAITiles(organizationId),
    getCustomAITiles(organizationId),
  ])

  return {
    builtIn: builtInTiles,
    custom: customTiles,
  }
}
