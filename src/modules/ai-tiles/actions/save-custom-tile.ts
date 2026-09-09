/**
 * Save Custom Tile Action
 *
 * Server action to create or update a custom AI tile configuration.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export interface CustomAITile {
  id?: string
  name: string
  prompt: string
  dataSources: string[]
  refreshSchedule: string
  organizationId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

export interface SaveCustomTileResult {
  success: boolean
  tile?: CustomAITile
  error?: string
}

/**
 * Save (create or update) a custom AI tile
 */
export async function saveCustomTile(data: {
  id?: string
  name: string
  prompt: string
  dataSources: string[]
  refreshSchedule: string
}): Promise<SaveCustomTileResult> {
  try {
    const { id, name, prompt, dataSources, refreshSchedule } = data

    // Validate input
    if (!name || !name.trim()) {
      return { success: false, error: 'Tile name is required' }
    }

    if (name.length > 50) {
      return { success: false, error: 'Tile name must be 50 characters or less' }
    }

    if (!prompt || !prompt.trim()) {
      return { success: false, error: 'Prompt is required' }
    }

    if (prompt.length > 500) {
      return { success: false, error: 'Prompt must be 500 characters or less' }
    }

    if (!dataSources || dataSources.length === 0) {
      return { success: false, error: 'At least one data source is required' }
    }

    // Validate data sources
    const validDataSources = ['donors', 'volunteers', 'gifts', 'contacts', 'communications']
    const invalidSources = dataSources.filter(s => !validDataSources.includes(s))
    if (invalidSources.length > 0) {
      return { success: false, error: `Invalid data sources: ${invalidSources.join(', ')}` }
    }

    // Validate refresh schedule
    const validSchedules = ['daily', 'weekly', 'manual']
    if (!validSchedules.includes(refreshSchedule)) {
      return { success: false, error: 'Invalid refresh schedule' }
    }

    // Get organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get current user
    let userId: string | null = null

    // In BYPASS_AUTH mode, skip auth checks
    if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      userId = null // Will be set to NULL in DB
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      userId = user.id

      // Verify user has access to the organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        return { success: false, error: 'Access denied to this organization' }
      }
    }

    // Create or update tile
    if (id) {
      // Update existing tile
      const { data: tile, error } = await supabase
        .from('custom_ai_tiles')
        .update({
          name: name.trim(),
          prompt: prompt.trim(),
          data_sources: dataSources,
          refresh_schedule: refreshSchedule,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update custom tile:', error)
        return { success: false, error: 'Failed to update tile' }
      }

      if (!tile) {
        return { success: false, error: 'Tile not found' }
      }

      // Revalidate relevant pages
      revalidatePath('/dashboard')
      revalidatePath('/settings/ai-tiles')

      return {
        success: true,
        tile: {
          id: tile.id,
          name: tile.name,
          prompt: tile.prompt,
          dataSources: tile.data_sources,
          refreshSchedule: tile.refresh_schedule,
          organizationId: tile.organization_id,
          createdBy: tile.created_by,
          createdAt: tile.created_at,
          updatedAt: tile.updated_at,
          isActive: tile.is_active,
        },
      }
    } else {
      // Create new tile
      const { data: tile, error } = await supabase
        .from('custom_ai_tiles')
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          prompt: prompt.trim(),
          data_sources: dataSources,
          refresh_schedule: refreshSchedule,
          is_active: true,
          created_by: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create custom tile:', error)
        return { success: false, error: 'Failed to create tile' }
      }

      if (!tile) {
        return { success: false, error: 'Failed to create tile' }
      }

      // Revalidate relevant pages
      revalidatePath('/dashboard')
      revalidatePath('/settings/ai-tiles')

      return {
        success: true,
        tile: {
          id: tile.id,
          name: tile.name,
          prompt: tile.prompt,
          dataSources: tile.data_sources,
          refreshSchedule: tile.refresh_schedule,
          organizationId: tile.organization_id,
          createdBy: tile.created_by,
          createdAt: tile.created_at,
          updatedAt: tile.updated_at,
          isActive: tile.is_active,
        },
      }
    }
  } catch (error) {
    console.error('Save custom tile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save tile',
    }
  }
}
