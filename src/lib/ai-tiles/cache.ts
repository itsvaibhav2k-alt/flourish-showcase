/**
 * AI Tiles Cache Management
 *
 * Handles caching of AI-generated tile data using the dedicated ai_tile_cache table.
 * This provides indexed queries and proper RLS policies for better performance.
 */

import { createAdminClient } from '@/lib/supabase/admin'

// Extend BuiltInTileId type for our generators
export type BuiltInTileId = 'donor-health' | 'weekly-priorities' | 'org-pulse'

export interface CachedTileData<T = unknown> {
  content: T
  generatedAt: string
  expiresAt?: string
}

/**
 * Get cached AI tile data from the ai_tile_cache table
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile (built-in ID or 'custom')
 * @param customTileId - Optional custom tile ID for custom tiles
 * @returns Cached data or null if not found/expired
 */
export async function getCachedTileData<T = unknown>(
  organizationId: string,
  tileType: BuiltInTileId | 'custom',
  customTileId?: string
): Promise<T | null> {
  const supabase = createAdminClient()

  // Query the dedicated ai_tile_cache table
  let query = supabase
    .from('ai_tile_cache')
    .select('data, created_at, expires_at')
    .eq('organization_id', organizationId)
    .gt('expires_at', new Date().toISOString())
    .single()

  // For custom tiles, match by tile_type='custom' and tile_id=customTileId
  // For built-in tiles, match by tile_type=tileType
  if (tileType === 'custom' && customTileId) {
    query = supabase
      .from('ai_tile_cache')
      .select('data, created_at, expires_at')
      .eq('organization_id', organizationId)
      .eq('tile_type', 'custom')
      .eq('tile_id', customTileId)
      .gt('expires_at', new Date().toISOString())
      .single()
  } else {
    query = supabase
      .from('ai_tile_cache')
      .select('data, created_at, expires_at')
      .eq('organization_id', organizationId)
      .eq('tile_type', tileType)
      .gt('expires_at', new Date().toISOString())
      .single()
  }

  const { data, error } = await query

  if (error || !data) {
    // Not found or expired is normal, don't log unless it's an unexpected error
    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch cached tile data:', error)
    }
    return null
  }

  return data.data as T
}

/**
 * Set cached AI tile data in the ai_tile_cache table
 * Uses upsert to handle both insert and update cases
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile (built-in ID or 'custom')
 * @param data - Data to cache
 * @param customTileId - Optional custom tile ID for custom tiles
 * @param ttlHours - Time to live in hours (default: 24)
 */
export async function setCachedTileData<T = unknown>(
  organizationId: string,
  tileType: BuiltInTileId | 'custom',
  data: T,
  customTileId?: string,
  ttlHours: number = 24
): Promise<void> {
  const supabase = createAdminClient()

  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

  // Upsert into the ai_tile_cache table
  const { error } = await supabase
    .from('ai_tile_cache')
    .upsert(
      {
        organization_id: organizationId,
        tile_type: tileType === 'custom' ? 'custom' : tileType,
        tile_id: tileType === 'custom' ? customTileId : null,
        data: data,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'organization_id,tile_type,tile_id',
      }
    )

  if (error) {
    console.error('Failed to cache tile data:', error)
    throw new Error('Failed to cache tile data')
  }
}

/**
 * Clear cached AI tile data from the ai_tile_cache table
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile to clear (optional - clears all if not provided)
 * @param customTileId - Optional custom tile ID for custom tiles
 */
export async function clearCachedTileData(
  organizationId: string,
  tileType?: BuiltInTileId | 'custom',
  customTileId?: string
): Promise<void> {
  const supabase = createAdminClient()

  let query = supabase
    .from('ai_tile_cache')
    .delete()
    .eq('organization_id', organizationId)

  if (tileType) {
    if (tileType === 'custom' && customTileId) {
      query = query.eq('tile_type', 'custom').eq('tile_id', customTileId)
    } else if (tileType !== 'custom') {
      query = query.eq('tile_type', tileType)
    }
  }

  const { error } = await query

  if (error) {
    console.error('Failed to clear cached tile data:', error)
  }
}

/**
 * Get all cached tiles for an organization from the ai_tile_cache table
 *
 * @param organizationId - The organization ID
 * @returns Map of cache keys to cached data
 */
export async function getAllCachedTiles(
  organizationId: string
): Promise<Map<string, CachedTileData>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ai_tile_cache')
    .select('tile_type, tile_id, data, created_at, expires_at')
    .eq('organization_id', organizationId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Failed to fetch cached tiles:', error)
    return new Map()
  }

  const result = new Map<string, CachedTileData>()

  for (const row of data || []) {
    // Build cache key: for custom tiles use 'custom:uuid', for built-in use tile_type
    const cacheKey = row.tile_type === 'custom' && row.tile_id
      ? `custom:${row.tile_id}`
      : row.tile_type

    result.set(cacheKey, {
      content: row.data,
      generatedAt: row.created_at,
      expiresAt: row.expires_at,
    })
  }

  return result
}

/**
 * Check if a tile's cache is expired
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile
 * @param customTileId - Optional custom tile ID for custom tiles
 * @returns True if cache is expired or missing
 */
export async function isCacheExpired(
  organizationId: string,
  tileType: BuiltInTileId | 'custom',
  customTileId?: string
): Promise<boolean> {
  const supabase = createAdminClient()

  let query = supabase
    .from('ai_tile_cache')
    .select('expires_at')
    .eq('organization_id', organizationId)
    .single()

  if (tileType === 'custom' && customTileId) {
    query = supabase
      .from('ai_tile_cache')
      .select('expires_at')
      .eq('organization_id', organizationId)
      .eq('tile_type', 'custom')
      .eq('tile_id', customTileId)
      .single()
  } else {
    query = supabase
      .from('ai_tile_cache')
      .select('expires_at')
      .eq('organization_id', organizationId)
      .eq('tile_type', tileType)
      .single()
  }

  const { data, error } = await query

  if (error || !data) {
    return true // No cache = expired
  }

  // Check expiration
  const expiresAt = new Date(data.expires_at)
  const now = new Date()
  return now > expiresAt
}

/**
 * Invalidate tile cache (alias for clearCachedTileData for compatibility)
 *
 * @param organizationId - The organization ID
 * @param tileType - Type of tile to invalidate (optional - invalidates all if not provided)
 */
export async function invalidateTileCache(
  organizationId: string,
  tileType?: BuiltInTileId | 'custom'
): Promise<void> {
  return clearCachedTileData(organizationId, tileType)
}
