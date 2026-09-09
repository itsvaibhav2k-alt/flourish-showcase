/**
 * AI Tiles Manual Refresh Actions
 *
 * Server actions for triggering manual refresh of AI tiles.
 * These actions send events to Inngest to handle the refresh asynchronously.
 */

'use server'

import { inngest } from '@/lib/inngest/client'
import { createClient } from '@/lib/supabase/server'
import type { BuiltInTileId } from '../registry'

/**
 * Trigger refresh for all tiles in an organization
 */
export async function triggerFullRefresh(): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Send Inngest event to refresh all tiles
    await inngest.send({
      name: 'ai-tiles/refresh',
      data: {
        organizationId: profile.organization_id,
      },
    })

    return {
      success: true,
      message: 'Refresh started. Your tiles will update shortly.',
    }
  } catch (error) {
    console.error('Error triggering full refresh:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger refresh',
    }
  }
}

/**
 * Trigger refresh for specific tiles
 */
export async function triggerTilesRefresh(
  tileTypes: string[]
): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    if (!tileTypes || tileTypes.length === 0) {
      return { success: false, error: 'No tiles specified' }
    }

    // Send Inngest event to refresh specific tiles
    await inngest.send({
      name: 'ai-tiles/refresh',
      data: {
        organizationId: profile.organization_id,
        tileTypes,
      },
    })

    return {
      success: true,
      message: `Refreshing ${tileTypes.length} tile${tileTypes.length > 1 ? 's' : ''}...`,
    }
  } catch (error) {
    console.error('Error triggering tiles refresh:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger refresh',
    }
  }
}

/**
 * Trigger refresh for a single tile
 */
export async function triggerTileRefresh(
  tileType: BuiltInTileId | 'custom',
  tileId?: string
): Promise<{
  success: boolean
  error?: string
  message?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Validate custom tile ID
    if (tileType === 'custom' && !tileId) {
      return { success: false, error: 'Custom tiles require a tile ID' }
    }

    // Send Inngest event to refresh single tile
    await inngest.send({
      name: 'ai-tiles/refresh-single',
      data: {
        organizationId: profile.organization_id,
        tileType,
        tileId,
      },
    })

    return {
      success: true,
      message: 'Tile refresh started...',
    }
  } catch (error) {
    console.error('Error triggering tile refresh:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger refresh',
    }
  }
}

/**
 * Schedule a custom tile to refresh on a specific schedule
 */
export async function updateTileRefreshSchedule(
  tileId: string,
  schedule: 'daily' | 'weekly' | 'manual'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current user's organization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return { success: false, error: 'No organization found' }
    }

    // Update custom tile refresh schedule
    const { error } = await supabase
      .from('custom_ai_tiles')
      .update({ refresh_schedule: schedule })
      .eq('id', tileId)
      .eq('organization_id', profile.organization_id)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating refresh schedule:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update schedule',
    }
  }
}
