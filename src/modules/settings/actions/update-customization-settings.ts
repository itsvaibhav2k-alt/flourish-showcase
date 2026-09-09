'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import {
  CustomizationSettings,
  NavItemConfig,
  DashboardTileConfig,
  DEFAULT_CUSTOMIZATION_SETTINGS,
} from '../schemas/customization'
import type { Json } from '@/lib/supabase/types'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Update the full customization settings.
 * Only administrators can update these settings.
 */
export async function updateCustomizationSettings(
  customization: CustomizationSettings
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update customization
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can update customization settings.',
      }
    }

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Fetch current settings
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Merge customization into existing settings
    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      customization: customization,
    }

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings as Json })
      .eq('id', organizationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Revalidate affected pages
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout') // Revalidate layout for navigation changes

    return { success: true }
  } catch (error) {
    console.error('Error in updateCustomizationSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customization settings',
    }
  }
}

/**
 * Update only the navigation configuration.
 */
export async function updateNavigationConfig(
  navigation: NavItemConfig[]
): Promise<ActionResult> {
  try {
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can update navigation settings.',
      }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const currentCustomization = (currentSettings.customization as CustomizationSettings) || {
      version: 1,
      navigation: [],
      dashboard: { tiles: DEFAULT_CUSTOMIZATION_SETTINGS.dashboard.tiles },
    }

    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      customization: {
        ...currentCustomization,
        version: 1,
        navigation,
      },
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings as Json })
      .eq('id', organizationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in updateNavigationConfig:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update navigation settings',
    }
  }
}

/**
 * Update only the dashboard tiles configuration.
 */
export async function updateDashboardTilesConfig(
  tiles: DashboardTileConfig[]
): Promise<ActionResult> {
  try {
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can update dashboard settings.',
      }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const currentCustomization = (currentSettings.customization as CustomizationSettings) || {
      version: 1,
      navigation: DEFAULT_CUSTOMIZATION_SETTINGS.navigation,
      dashboard: { tiles: [] },
    }

    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      customization: {
        ...currentCustomization,
        version: 1,
        dashboard: { tiles },
      },
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings as Json })
      .eq('id', organizationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in updateDashboardTilesConfig:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update dashboard settings',
    }
  }
}

/**
 * Reset customization to defaults.
 */
export async function resetCustomizationToDefaults(
  type: 'navigation' | 'dashboard' | 'all'
): Promise<ActionResult> {
  try {
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can reset customization settings.',
      }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const currentCustomization = (currentSettings.customization as CustomizationSettings) || DEFAULT_CUSTOMIZATION_SETTINGS

    let updatedCustomization: CustomizationSettings

    switch (type) {
      case 'navigation':
        updatedCustomization = {
          ...currentCustomization,
          navigation: DEFAULT_CUSTOMIZATION_SETTINGS.navigation,
        }
        break
      case 'dashboard':
        updatedCustomization = {
          ...currentCustomization,
          dashboard: DEFAULT_CUSTOMIZATION_SETTINGS.dashboard,
        }
        break
      case 'all':
        updatedCustomization = DEFAULT_CUSTOMIZATION_SETTINGS
        break
    }

    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      customization: updatedCustomization,
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings as Json })
      .eq('id', organizationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in resetCustomizationToDefaults:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset customization settings',
    }
  }
}
