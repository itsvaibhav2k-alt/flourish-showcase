/**
 * AI Tiles Server Actions
 *
 * Server actions for enabling, disabling, and managing AI tiles.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import type { BuiltInTileId, DataSource } from './registry'
import { isValidAITileId } from './registry'
import type { Json } from '@/lib/supabase/types'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Enable a built-in AI tile for the current organization
 *
 * @param tileId - The built-in AI tile ID to enable
 * @returns ActionResult indicating success or failure
 */
export async function enableAITile(tileId: BuiltInTileId): Promise<ActionResult> {
  try {
    // Check user role - only admins can manage AI tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to enable AI tile without admin role',
        { role, tileId }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can manage AI tiles.',
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

    // Validate tile ID
    if (!isValidAITileId(tileId)) {
      return {
        success: false,
        error: 'Invalid AI tile ID',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch current settings
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      console.error('Error fetching organization settings:', fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    const existingSettings = (org?.settings as Record<string, Json>) || {}
    const aiTiles = (existingSettings.ai_tiles as Record<string, Json>) || {}

    // Enable the tile
    const updatedAITiles = {
      ...aiTiles,
      [tileId]: {
        enabled: true,
        enabled_at: new Date().toISOString(),
      },
    }

    const updatedSettings: Record<string, Json> = {
      ...existingSettings,
      ai_tiles: updatedAITiles,
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error enabling AI tile:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/ai')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in enableAITile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable AI tile',
    }
  }
}

/**
 * Disable a built-in AI tile for the current organization
 *
 * @param tileId - The built-in AI tile ID to disable
 * @returns ActionResult indicating success or failure
 */
export async function disableAITile(tileId: BuiltInTileId): Promise<ActionResult> {
  try {
    // Check user role - only admins can manage AI tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to disable AI tile without admin role',
        { role, tileId }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can manage AI tiles.',
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

    // Validate tile ID
    if (!isValidAITileId(tileId)) {
      return {
        success: false,
        error: 'Invalid AI tile ID',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch current settings
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      console.error('Error fetching organization settings:', fetchError)
      return {
        success: false,
        error: fetchError.message,
      }
    }

    const existingSettings = (org?.settings as Record<string, Json>) || {}
    const aiTiles = (existingSettings.ai_tiles as Record<string, Json>) || {}

    // Disable the tile
    const updatedAITiles = {
      ...aiTiles,
      [tileId]: {
        enabled: false,
        disabled_at: new Date().toISOString(),
      },
    }

    const updatedSettings: Record<string, Json> = {
      ...existingSettings,
      ai_tiles: updatedAITiles,
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error disabling AI tile:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/ai')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in disableAITile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable AI tile',
    }
  }
}

/**
 * Create a custom AI tile
 *
 * @param data - Custom tile configuration
 * @returns ActionResult with tile ID if successful
 */
export async function createCustomTile(data: {
  name: string
  description: string
  prompt: string
  refreshSchedule: 'daily' | 'weekly' | 'manual'
  dataSources: DataSource[]
}): Promise<ActionResult & { tileId?: string }> {
  try {
    // Check user role - only admins can create custom tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to create custom AI tile without admin role',
        { role }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can create custom AI tiles.',
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

    // Validate inputs
    if (!data.name || !data.description || !data.prompt) {
      return {
        success: false,
        error: 'Name, description, and prompt are required',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert custom tile
    // Note: This assumes a 'custom_ai_tiles' table exists
    const { data: tile, error: insertError } = await supabase
      .from('custom_ai_tiles')
      .insert({
        organization_id: organizationId,
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        refresh_schedule: data.refreshSchedule,
        data_sources: data.dataSources,
        is_active: true,
      })
      .select('id')
      .single()

    if (insertError) {
      // If table doesn't exist yet, provide helpful error
      if (insertError.code === '42P01') {
        return {
          success: false,
          error:
            'Custom AI tiles feature requires database migration. Please contact support.',
        }
      }
      console.error('Error creating custom AI tile:', insertError)
      return {
        success: false,
        error: insertError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/ai')
    revalidatePath('/dashboard')

    return {
      success: true,
      tileId: tile.id,
    }
  } catch (error) {
    console.error('Error in createCustomTile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create custom tile',
    }
  }
}

/**
 * Update a custom AI tile
 *
 * @param id - The custom tile ID
 * @param data - Partial tile data to update
 * @returns ActionResult indicating success or failure
 */
export async function updateCustomTile(
  id: string,
  data: {
    name?: string
    description?: string
    prompt?: string
    refreshSchedule?: 'daily' | 'weekly' | 'manual'
    dataSources?: DataSource[]
    enabled?: boolean
  }
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update custom tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to update custom AI tile without admin role',
        { role, id }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can update custom AI tiles.',
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

    // Create Supabase client
    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.prompt !== undefined) updateData.prompt = data.prompt
    if (data.refreshSchedule !== undefined)
      updateData.refresh_schedule = data.refreshSchedule
    if (data.dataSources !== undefined) updateData.data_sources = data.dataSources
    if (data.enabled !== undefined) updateData.is_active = data.enabled

    // Update custom tile
    const { error: updateError } = await supabase
      .from('custom_ai_tiles')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId) // Ensure user owns this tile

    if (updateError) {
      // If table doesn't exist yet, provide helpful error
      if (updateError.code === '42P01') {
        return {
          success: false,
          error:
            'Custom AI tiles feature requires database migration. Please contact support.',
        }
      }
      console.error('Error updating custom AI tile:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/ai')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateCustomTile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update custom tile',
    }
  }
}

/**
 * Delete a custom AI tile
 *
 * @param id - The custom tile ID to delete
 * @returns ActionResult indicating success or failure
 */
export async function deleteCustomTile(id: string): Promise<ActionResult> {
  try {
    // Check user role - only admins can delete custom tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to delete custom AI tile without admin role',
        { role, id }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can delete custom AI tiles.',
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

    // Create Supabase client
    const supabase = await createClient()

    // Delete custom tile
    const { error: deleteError } = await supabase
      .from('custom_ai_tiles')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId) // Ensure user owns this tile

    if (deleteError) {
      // If table doesn't exist yet, provide helpful error
      if (deleteError.code === '42P01') {
        return {
          success: false,
          error:
            'Custom AI tiles feature requires database migration. Please contact support.',
        }
      }
      console.error('Error deleting custom AI tile:', deleteError)
      return {
        success: false,
        error: deleteError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/ai')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteCustomTile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete custom tile',
    }
  }
}

/**
 * Manually trigger a refresh of cached AI tile content
 *
 * @param tileType - Type of tile ('built-in' or 'custom')
 * @param tileId - The tile ID (BuiltInTileId or custom UUID)
 * @returns ActionResult indicating success or failure
 */
export async function refreshTileCache(
  tileType: 'built-in' | 'custom',
  tileId?: string
): Promise<ActionResult> {
  try {
    // Check user role - only admins can refresh tiles
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to refresh AI tile cache without admin role',
        { role, tileType, tileId }
      )
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

    if (!tileId) {
      return {
        success: false,
        error: 'Tile ID is required',
      }
    }

    // TODO: Implement actual AI tile generation logic
    // This would involve:
    // 1. Fetching relevant data based on tile's dataSources
    // 2. Building a prompt for Claude
    // 3. Generating AI content
    // 4. Caching the result in organization settings

    // For now, return a placeholder
    return {
      success: false,
      error:
        'AI tile refresh not yet implemented. This will be added in a future update.',
    }
  } catch (error) {
    console.error('Error in refreshTileCache:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh tile cache',
    }
  }
}
