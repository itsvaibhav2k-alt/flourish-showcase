/**
 * Add-On Pages Library
 *
 * Central export point for all add-on page functionality.
 */

export {
  type AddonPageId,
  type AddonPageTemplate,
  ADDON_PAGE_TEMPLATES,
  getAddonPageTemplate,
  getAllAddonPages,
  getAddonPagesByCategory,
  isValidAddonPageId,
} from './registry'

export {
  getEnabledAddonPages,
  isAddonPageEnabled,
  getAddonPageConfig,
} from './queries'

export {
  enableAddonPage,
  disableAddonPage,
  updateAddonPageConfig,
} from './actions'
