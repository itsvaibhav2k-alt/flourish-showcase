'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import {
  CustomizationSettings,
  DEFAULT_CUSTOMIZATION_SETTINGS,
  NavItemId,
  DashboardTileId,
  NavItemConfig,
  DashboardTileConfig,
} from '../schemas/customization'

/**
 * Merges stored customization with defaults.
 * Ensures new nav items/tiles added in future releases appear with sensible defaults.
 */
function mergeWithDefaults(
  stored: Partial<CustomizationSettings> | null | undefined
): CustomizationSettings {
  if (!stored) {
    return DEFAULT_CUSTOMIZATION_SETTINGS
  }

  // Merge navigation: keep stored order/visibility, add missing items at end
  const storedNavIds = new Set(stored.navigation?.map((n) => n.id) ?? [])
  const mergedNavigation: NavItemConfig[] = [
    ...(stored.navigation ?? []),
    ...DEFAULT_CUSTOMIZATION_SETTINGS.navigation
      .filter((n) => !storedNavIds.has(n.id))
      .map((n, i) => ({ ...n, order: (stored.navigation?.length ?? 0) + i })),
  ]

  // Merge dashboard tiles similarly
  const storedTileIds = new Set(stored.dashboard?.tiles?.map((t) => t.id) ?? [])
  const mergedTiles: DashboardTileConfig[] = [
    ...(stored.dashboard?.tiles ?? []),
    ...DEFAULT_CUSTOMIZATION_SETTINGS.dashboard.tiles
      .filter((t) => !storedTileIds.has(t.id))
      .map((t, i) => ({
        ...t,
        order: (stored.dashboard?.tiles?.length ?? 0) + i,
        visible: true, // New tiles default to visible
      })),
  ]

  return {
    version: 1,
    navigation: mergedNavigation,
    dashboard: {
      tiles: mergedTiles,
    },
  }
}

/**
 * Get customization settings for the current organization.
 * Returns merged settings with defaults for any missing items.
 */
export async function getCustomizationSettings(): Promise<CustomizationSettings> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return DEFAULT_CUSTOMIZATION_SETTINGS
    }

    const supabase = await createClient()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    if (error || !org) {
      // PGRST116 = "not found" - expected in BYPASS_AUTH mode or new orgs
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching customization settings:', error)
      }
      return DEFAULT_CUSTOMIZATION_SETTINGS
    }

    const settings = org.settings as Record<string, unknown> | null
    const stored = settings?.customization as Partial<CustomizationSettings> | undefined

    return mergeWithDefaults(stored)
  } catch (error) {
    console.error('Error in getCustomizationSettings:', error)
    return DEFAULT_CUSTOMIZATION_SETTINGS
  }
}

/**
 * Get visible navigation items in order.
 * Filters out hidden items and sorts by order.
 */
export async function getVisibleNavigation(): Promise<NavItemId[]> {
  const settings = await getCustomizationSettings()
  return settings.navigation
    .filter((n) => n.visible)
    .sort((a, b) => a.order - b.order)
    .map((n) => n.id)
}

/**
 * Get visible dashboard tiles in order.
 * Filters out hidden tiles and sorts by order.
 */
export async function getVisibleDashboardTiles(): Promise<DashboardTileId[]> {
  const settings = await getCustomizationSettings()
  return settings.dashboard.tiles
    .filter((t) => t.visible)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id)
}

/**
 * Get visible dashboard tiles by category.
 */
export async function getVisibleDashboardTilesByCategory(): Promise<{
  stats: DashboardTileId[]
  actions: DashboardTileId[]
  widgets: DashboardTileId[]
}> {
  const visibleTiles = await getVisibleDashboardTiles()

  return {
    stats: visibleTiles.filter((id) => id.startsWith('stat-')),
    actions: visibleTiles.filter((id) => id.startsWith('action-')),
    widgets: visibleTiles.filter((id) => id.startsWith('widget-')),
  }
}
