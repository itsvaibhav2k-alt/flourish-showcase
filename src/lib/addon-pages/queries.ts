/**
 * Add-On Pages Query Functions
 *
 * Functions for fetching enabled add-on pages from organization settings.
 */

import { createClient } from '@/lib/supabase/server'
import type { AddonPageId, AddonPageTemplate } from './registry'
import { ADDON_PAGE_TEMPLATES } from './registry'

/**
 * Get all enabled add-on page IDs for an organization
 *
 * @param organizationId - The organization ID
 * @returns Array of enabled add-on page IDs
 */
export async function getEnabledAddonPages(
  organizationId: string
): Promise<AddonPageId[]> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    // PGRST116 = "not found" - expected in BYPASS_AUTH mode or new orgs
    if (error?.code !== 'PGRST116') {
      console.error('Failed to fetch organization settings:', error)
    }
    return []
  }

  const settings = (org.settings as Record<string, unknown>) || {}
  const addonPages = (settings.addon_pages as Record<string, unknown>) || {}

  // Extract enabled page IDs
  const enabledPages: AddonPageId[] = []
  for (const [pageId, config] of Object.entries(addonPages)) {
    if (
      config &&
      typeof config === 'object' &&
      'enabled' in config &&
      config.enabled === true
    ) {
      enabledPages.push(pageId as AddonPageId)
    }
  }

  return enabledPages
}

/**
 * Check if a specific add-on page is enabled for an organization
 *
 * @param organizationId - The organization ID
 * @param pageId - The add-on page ID to check
 * @returns True if the page is enabled, false otherwise
 */
export async function isAddonPageEnabled(
  organizationId: string,
  pageId: AddonPageId
): Promise<boolean> {
  const enabledPages = await getEnabledAddonPages(organizationId)
  return enabledPages.includes(pageId)
}

/**
 * Get configuration for a specific add-on page
 *
 * @param organizationId - The organization ID
 * @param pageId - The add-on page ID
 * @returns Page configuration object or null if not found
 */
export async function getAddonPageConfig(
  organizationId: string,
  pageId: AddonPageId
): Promise<Record<string, unknown> | null> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    // PGRST116 = "not found" - expected in BYPASS_AUTH mode or new orgs
    if (error?.code !== 'PGRST116') {
      console.error('Failed to fetch organization settings:', error)
    }
    return null
  }

  const settings = (org.settings as Record<string, unknown>) || {}
  const addonPages = (settings.addon_pages as Record<string, unknown>) || {}
  const pageConfig = addonPages[pageId]

  if (!pageConfig || typeof pageConfig !== 'object') {
    return null
  }

  return pageConfig as Record<string, unknown>
}

/**
 * Get enabled add-on pages with their metadata for navigation
 *
 * @param organizationId - The organization ID
 * @returns Array of enabled add-on page templates with metadata
 */
export async function getEnabledAddonPagesWithMetadata(
  organizationId: string
): Promise<AddonPageTemplate[]> {
  const enabledPageIds = await getEnabledAddonPages(organizationId)

  return enabledPageIds
    .map((id) => ADDON_PAGE_TEMPLATES[id])
    .filter((template): template is AddonPageTemplate => template !== undefined)
}
