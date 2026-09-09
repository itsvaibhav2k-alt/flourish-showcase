/**
 * AI Tiles Refresh Background Jobs
 *
 * Inngest functions for refreshing AI-powered dashboard tiles.
 * Includes scheduled cron jobs and event-triggered refreshes.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateDonorHealthInsights } from '@/lib/ai-tiles/generators/donor-health'
import { generateWeeklyPrioritiesInsights } from '@/lib/ai-tiles/generators/weekly-priorities'
import { generateOrgPulseInsights } from '@/lib/ai-tiles/generators/org-pulse'
import { generateCustomTileInsights } from '@/lib/ai-tiles/generators/custom'
import { setCachedTileData, clearCachedTileData } from '@/lib/ai-tiles/cache'
import { getEnabledAITiles, getCustomAITiles } from '@/lib/ai-tiles/queries'
import type { BuiltInTileId } from '@/lib/ai-tiles/registry'

interface TileRefreshResult {
  tileId: string
  success: boolean
  error?: string
  generatedAt?: string
}

/**
 * Scheduled job - Refreshes all AI tiles daily at 5 AM UTC
 */
export const refreshAITilesCron = inngest.createFunction(
  {
    id: 'refresh-ai-tiles-cron',
    name: 'Refresh AI Tiles (Scheduled)',
    concurrency: {
      limit: 5, // Process max 5 orgs concurrently
    },
  },
  { cron: '0 5 * * *' }, // 5 AM UTC daily
  async ({ step }) => {
    // Step 1: Get all organizations with AI tiles enabled
    const organizations = await step.run('fetch-organizations', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, settings')

      if (error) {
        throw new Error(`Failed to fetch organizations: ${error.message}`)
      }

      // Filter orgs with AI tiles enabled
      return (data || []).filter((org) => {
        const settings = (org.settings as Record<string, unknown>) || {}
        const aiTiles = (settings.ai_tiles as Record<string, unknown>) || {}
        return Object.keys(aiTiles).length > 0
      })
    })

    if (!organizations || organizations.length === 0) {
      return {
        message: 'No organizations with AI tiles enabled',
        organizationsProcessed: 0,
        totalTilesRefreshed: 0,
      }
    }

    // Step 2: Process each organization
    const results = await Promise.all(
      organizations.map((org) =>
        step.run(`refresh-org-${org.id}`, async () => {
          try {
            const refreshResults = await refreshOrganizationTiles(org.id)
            return {
              organizationId: org.id,
              organizationName: org.name,
              success: true,
              results: refreshResults,
            }
          } catch (error) {
            console.error(`Error refreshing tiles for org ${org.id}:`, error)
            return {
              organizationId: org.id,
              organizationName: org.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        })
      )
    )

    // Calculate stats
    const successCount = results.filter((r) => r.success).length
    const totalTilesRefreshed = results.reduce((sum, r) => {
      if (r.success && r.results) {
        return sum + r.results.filter((t: TileRefreshResult) => t.success).length
      }
      return sum
    }, 0)

    return {
      message: 'AI tiles refresh completed',
      organizationsProcessed: organizations.length,
      organizationsSucceeded: successCount,
      totalTilesRefreshed,
      results,
    }
  }
)

/**
 * Event-triggered refresh for all tiles in a single organization
 */
export const refreshAITilesEvent = inngest.createFunction(
  {
    id: 'refresh-ai-tiles-event',
    name: 'Refresh AI Tiles (Event)',
  },
  { event: 'ai-tiles/refresh' },
  async ({ event, step }) => {
    const { organizationId, tileTypes } = event.data

    const results = await step.run('refresh-tiles', async () => {
      if (tileTypes && Array.isArray(tileTypes)) {
        // Refresh specific tiles
        return await refreshSpecificTiles(organizationId, tileTypes)
      } else {
        // Refresh all enabled tiles
        return await refreshOrganizationTiles(organizationId)
      }
    })

    return {
      organizationId,
      tilesRefreshed: results.filter((r) => r.success).length,
      results,
    }
  }
)

/**
 * Manual refresh for a single specific tile
 */
export const refreshSingleTile = inngest.createFunction(
  {
    id: 'refresh-single-tile',
    name: 'Refresh Single AI Tile',
  },
  { event: 'ai-tiles/refresh-single' },
  async ({ event, step }) => {
    const { organizationId, tileType, tileId } = event.data

    const result = await step.run('generate-insight', async () => {
      try {
        // Clear existing cache first
        if (tileId) {
          await clearCachedTileData(organizationId, tileType, tileId)
        } else {
          await clearCachedTileData(organizationId, tileType)
        }

        // Generate fresh insights
        const generatedAt = new Date().toISOString()

        if (tileType === 'custom' && tileId) {
          // Refresh custom tile
          const customTiles = await getCustomAITiles(organizationId)
          const customTile = customTiles.find((t) => t.id === tileId)

          if (!customTile) {
            throw new Error(`Custom tile ${tileId} not found`)
          }

          await generateCustomTileInsights(
            organizationId,
            customTile.prompt,
            customTile.dataSources,
            tileId
          )
        } else {
          // Refresh built-in tile
          await refreshBuiltInTile(organizationId, tileType as BuiltInTileId)
        }

        return {
          tileId: tileId || tileType,
          success: true,
          generatedAt,
        }
      } catch (error) {
        console.error(`Error refreshing tile ${tileType}:`, error)
        return {
          tileId: tileId || tileType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })

    return result
  }
)

/**
 * Refresh all enabled tiles for an organization
 */
async function refreshOrganizationTiles(
  organizationId: string
): Promise<TileRefreshResult[]> {
  const results: TileRefreshResult[] = []

  // Get enabled built-in tiles
  const enabledTiles = await getEnabledAITiles(organizationId)

  // Refresh each built-in tile
  for (const tileId of enabledTiles) {
    try {
      const generatedAt = new Date().toISOString()
      await refreshBuiltInTile(organizationId, tileId)
      results.push({
        tileId,
        success: true,
        generatedAt,
      })
    } catch (error) {
      console.error(`Error refreshing tile ${tileId}:`, error)
      results.push({
        tileId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Get and refresh custom tiles
  const customTiles = await getCustomAITiles(organizationId)

  for (const customTile of customTiles) {
    // Only refresh if on daily schedule or if it's never been generated
    if (customTile.refreshSchedule === 'daily') {
      try {
        const generatedAt = new Date().toISOString()
        await generateCustomTileInsights(
          organizationId,
          customTile.prompt,
          customTile.dataSources,
          customTile.id
        )
        results.push({
          tileId: `custom-${customTile.id}`,
          success: true,
          generatedAt,
        })
      } catch (error) {
        console.error(`Error refreshing custom tile ${customTile.id}:`, error)
        results.push({
          tileId: `custom-${customTile.id}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  return results
}

/**
 * Refresh specific tiles by type
 */
async function refreshSpecificTiles(
  organizationId: string,
  tileTypes: string[]
): Promise<TileRefreshResult[]> {
  const results: TileRefreshResult[] = []

  for (const tileType of tileTypes) {
    try {
      const generatedAt = new Date().toISOString()

      if (tileType.startsWith('custom-')) {
        // Custom tile
        const customTileId = tileType.replace('custom-', '')
        const customTiles = await getCustomAITiles(organizationId)
        const customTile = customTiles.find((t) => t.id === customTileId)

        if (!customTile) {
          throw new Error(`Custom tile ${customTileId} not found`)
        }

        await generateCustomTileInsights(
          organizationId,
          customTile.prompt,
          customTile.dataSources,
          customTileId
        )
      } else {
        // Built-in tile
        await refreshBuiltInTile(organizationId, tileType as BuiltInTileId)
      }

      results.push({
        tileId: tileType,
        success: true,
        generatedAt,
      })
    } catch (error) {
      console.error(`Error refreshing tile ${tileType}:`, error)
      results.push({
        tileId: tileType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Refresh a specific built-in tile
 */
async function refreshBuiltInTile(
  organizationId: string,
  tileId: BuiltInTileId
): Promise<void> {
  switch (tileId) {
    case 'donor-health':
      await generateDonorHealthInsights(organizationId)
      break

    case 'weekly-priorities':
      await generateWeeklyPrioritiesInsights(organizationId)
      break

    case 'org-pulse':
      await generateOrgPulseInsights(organizationId)
      break

    default:
      throw new Error(`Unknown tile type: ${tileId}`)
  }
}
