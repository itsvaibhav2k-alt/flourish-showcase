'use server'

import { inngest } from '@/lib/inngest/client'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import { getCachedTileData, type BuiltInTileId } from '@/lib/ai-tiles/cache'

export interface RefreshTilesResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Server action to trigger AI tile refresh
 *
 * @param tileType - 'built-in', 'custom', or 'all'
 * @param tileId - Required for specific tiles, ignored for 'all'
 */
export async function refreshAITilesAction(
  tileType: 'built-in' | 'custom' | 'all',
  tileId?: string
): Promise<RefreshTilesResult> {
  try {
    // Check user role - only admins can refresh tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can refresh AI tiles.',
      }
    }

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    if (tileType === 'all') {
      // Trigger refresh for all tiles
      await inngest.send({
        name: 'ai-tiles/refresh',
        data: {
          organizationId,
        },
      })

      return {
        success: true,
      }
    }

    // Trigger single tile refresh
    if (!tileId && tileType !== 'all') {
      return {
        success: false,
        error: 'Tile ID is required for specific tile refresh',
      }
    }

    await inngest.send({
      name: 'ai-tiles/refresh-single',
      data: {
        organizationId,
        tileType: tileType === 'custom' ? 'custom' : tileId!,
        tileId: tileType === 'custom' ? tileId : undefined,
      },
    })

    // Wait a bit for the Inngest function to process
    // In production, this would use proper job status tracking
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Try to fetch the updated cached data
    const cachedData = await getCachedTileData(
      organizationId,
      tileType === 'custom' ? 'custom' : (tileId as BuiltInTileId),
      tileType === 'custom' ? tileId : undefined
    )

    return {
      success: true,
      data: cachedData,
    }
  } catch (error) {
    console.error('Error refreshing AI tiles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh AI tiles',
    }
  }
}
