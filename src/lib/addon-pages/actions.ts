/**
 * Add-On Pages Server Actions
 *
 * Server actions for enabling, disabling, and configuring add-on pages.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import type { AddonPageId } from './registry'
import { isValidAddonPageId } from './registry'
import type { Json } from '@/lib/supabase/types'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Enable an add-on page for the current organization
 *
 * @param pageId - The add-on page ID to enable
 * @returns ActionResult indicating success or failure
 */
export async function enableAddonPage(pageId: AddonPageId): Promise<ActionResult> {
  try {
    // Check user role - only admins can manage add-on pages
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to enable add-on page without admin role',
        { role, pageId }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can manage add-on pages.',
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

    // Validate page ID
    if (!isValidAddonPageId(pageId)) {
      return {
        success: false,
        error: 'Invalid add-on page ID',
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
    const addonPages = (existingSettings.addon_pages as Record<string, Json>) || {}

    // Enable the page
    const updatedAddonPages = {
      ...addonPages,
      [pageId]: {
        enabled: true,
        enabled_at: new Date().toISOString(),
      },
    }

    const updatedSettings: Record<string, Json> = {
      ...existingSettings,
      addon_pages: updatedAddonPages,
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error enabling add-on page:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/addons')
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in enableAddonPage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable add-on page',
    }
  }
}

/**
 * Disable an add-on page for the current organization
 *
 * @param pageId - The add-on page ID to disable
 * @returns ActionResult indicating success or failure
 */
export async function disableAddonPage(pageId: AddonPageId): Promise<ActionResult> {
  try {
    // Check user role - only admins can manage add-on pages
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to disable add-on page without admin role',
        { role, pageId }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can manage add-on pages.',
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

    // Validate page ID
    if (!isValidAddonPageId(pageId)) {
      return {
        success: false,
        error: 'Invalid add-on page ID',
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
    const addonPages = (existingSettings.addon_pages as Record<string, Json>) || {}

    // Disable the page
    const updatedAddonPages = {
      ...addonPages,
      [pageId]: {
        enabled: false,
        disabled_at: new Date().toISOString(),
      },
    }

    const updatedSettings: Record<string, Json> = {
      ...existingSettings,
      addon_pages: updatedAddonPages,
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error disabling add-on page:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/addons')
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in disableAddonPage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable add-on page',
    }
  }
}

/**
 * Update configuration for a specific add-on page
 *
 * @param pageId - The add-on page ID
 * @param config - Configuration object to merge with existing config
 * @returns ActionResult indicating success or failure
 */
export async function updateAddonPageConfig(
  pageId: AddonPageId,
  config: Record<string, unknown>
): Promise<ActionResult> {
  try {
    // Check user role - only admins can manage add-on pages
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to update add-on page config without admin role',
        { role, pageId }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can manage add-on pages.',
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

    // Validate page ID
    if (!isValidAddonPageId(pageId)) {
      return {
        success: false,
        error: 'Invalid add-on page ID',
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
    const addonPages = (existingSettings.addon_pages as Record<string, Json>) || {}
    const existingPageConfig = (addonPages[pageId] as Record<string, Json>) || {}

    // Merge new config with existing config
    const updatedPageConfig = {
      ...existingPageConfig,
      ...config,
      updated_at: new Date().toISOString(),
    }

    const updatedAddonPages = {
      ...addonPages,
      [pageId]: updatedPageConfig,
    }

    const updatedSettings: Record<string, Json> = {
      ...existingSettings,
      addon_pages: updatedAddonPages,
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating add-on page config:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate paths
    revalidatePath('/settings/addons')
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateAddonPageConfig:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update add-on page config',
    }
  }
}
