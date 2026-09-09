/**
 * Add-On Page Template Registry
 *
 * Defines available add-on pages that can be enabled/disabled by organizations.
 * Each page template includes metadata, icons, and category information.
 */

import { Mail, Users, FileText, Target, LucideIcon } from 'lucide-react'

export type AddonPageId =
  | 'flora-emails'
  | 'team-analytics'
  | 'grant-tracker'
  | 'campaign-central'

export interface AddonPageTemplate {
  id: AddonPageId
  name: string
  description: string
  icon: LucideIcon
  category: 'communication' | 'analytics' | 'management'
  requiredTables?: string[] // Database tables this page needs
  defaultEnabled: boolean
}

/**
 * Registry of all available add-on page templates
 */
export const ADDON_PAGE_TEMPLATES: Record<AddonPageId, AddonPageTemplate> = {
  'flora-emails': {
    id: 'flora-emails',
    name: 'Flora Emails Hub',
    description:
      'AI-powered email composition for thank-you notes, appeals, and re-engagement campaigns',
    icon: Mail,
    category: 'communication',
    requiredTables: ['email_drafts', 'sent_emails', 'contacts'],
    defaultEnabled: false,
  },
  'team-analytics': {
    id: 'team-analytics',
    name: 'Team Analytics',
    description:
      'Performance metrics, email statistics, and team activity insights across all members',
    icon: Users,
    category: 'analytics',
    requiredTables: [
      'organization_members',
      'email_drafts',
      'sent_emails',
      'copilot_actions',
    ],
    defaultEnabled: false,
  },
  'grant-tracker': {
    id: 'grant-tracker',
    name: 'Grant Tracker',
    description:
      'Manage grant applications, deadlines, reporting requirements, and funding pipeline',
    icon: FileText,
    category: 'management',
    requiredTables: ['grants', 'grant_reports'], // Tables would need to be created
    defaultEnabled: false,
  },
  'campaign-central': {
    id: 'campaign-central',
    name: 'Campaign Central',
    description:
      'Unified dashboard for fundraising campaigns with goals, progress tracking, and donor segments',
    icon: Target,
    category: 'management',
    requiredTables: ['campaigns', 'gifts', 'contacts'],
    defaultEnabled: false,
  },
}

/**
 * Get a specific add-on page template by ID
 */
export function getAddonPageTemplate(
  id: AddonPageId
): AddonPageTemplate | undefined {
  return ADDON_PAGE_TEMPLATES[id]
}

/**
 * Get all available add-on page templates
 */
export function getAllAddonPages(): AddonPageTemplate[] {
  return Object.values(ADDON_PAGE_TEMPLATES)
}

/**
 * Get add-on pages filtered by category
 */
export function getAddonPagesByCategory(
  category: 'communication' | 'analytics' | 'management'
): AddonPageTemplate[] {
  return getAllAddonPages().filter((page) => page.category === category)
}

/**
 * Check if a page ID is valid
 */
export function isValidAddonPageId(id: string): id is AddonPageId {
  return id in ADDON_PAGE_TEMPLATES
}
