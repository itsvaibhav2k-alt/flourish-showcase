import { z } from 'zod'

// Navigation item identifiers (matching dashboard-shell.tsx navigation array)
export const NavItemId = z.enum([
  'dashboard',
  'flora',
  'calendar',
  'contacts',
  'donors',
  'prospects',
  'pipeline',
  'donations',
  'volunteers',
  'communications',
  'reports',
  'settings',
])
export type NavItemId = z.infer<typeof NavItemId>

// Dashboard tile identifiers
export const DashboardTileId = z.enum([
  // Stats row
  'stat-total-contacts',
  'stat-active-donors',
  'stat-volunteers',
  'stat-emails-sent',
  // Quick actions
  'action-add-contact',
  'action-record-gift',
  'action-donation-forms',
  'action-create-shift',
  // Widgets
  'widget-copilot',
  'widget-recent-activity',
  'widget-upcoming-shifts',
  'widget-pending-drafts',
  'widget-my-tasks',
  'widget-donor-alerts',
  'widget-todays-actions',
  // AI Insights
  'ai-org-pulse',
  'ai-donor-health',
  'ai-weekly-priorities',
])
export type DashboardTileId = z.infer<typeof DashboardTileId>

// Navigation item configuration
export const navItemConfigSchema = z.object({
  id: NavItemId,
  visible: z.boolean().default(true),
  order: z.number().int().min(0),
})
export type NavItemConfig = z.infer<typeof navItemConfigSchema>

// Dashboard tile configuration
export const dashboardTileConfigSchema = z.object({
  id: DashboardTileId,
  visible: z.boolean().default(true),
  order: z.number().int().min(0),
})
export type DashboardTileConfig = z.infer<typeof dashboardTileConfigSchema>

// Add-on Pages configuration
export const addonPageConfigSchema = z.object({
  // Flora Emails specific config
  'flora-emails': z.object({
    autoSendApproved: z.boolean().default(false),
    defaultTemplate: z.enum(['thank-you', 'appeal', 're-engagement', 'custom']).default('thank-you'),
  }).optional(),
  // Team Analytics specific config
  'team-analytics': z.object({
    showPersonalStats: z.boolean().default(true),
  }).optional(),
  // Grant Tracker specific config
  'grant-tracker': z.object({
    reminderDaysBefore: z.number().default(14),
  }).optional(),
  // Campaign Central specific config
  'campaign-central': z.object({
    showGoalProgress: z.boolean().default(true),
  }).optional(),
})

export const addonPagesSettingsSchema = z.object({
  enabled: z.array(z.enum(['flora-emails', 'team-analytics', 'grant-tracker', 'campaign-central'])).default([]),
  config: addonPageConfigSchema.default({}),
})

// AI Tiles configuration
export const customAITileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  prompt: z.string().min(10).max(500),
  dataSources: z.array(z.enum(['donors', 'volunteers', 'gifts', 'contacts', 'communications'])).default(['donors']),
  refreshSchedule: z.enum(['daily', 'weekly', 'manual']).default('daily'),
})

export const aiTilesSettingsSchema = z.object({
  enabled: z.array(z.enum(['donor-health', 'weekly-priorities', 'org-pulse'])).default([]),
  custom: z.array(customAITileSchema).default([]),
  layout: z.record(z.string(), z.array(z.string())).default({}), // pageId -> tileIds
})

// Full customization settings schema
export const customizationSettingsSchema = z.object({
  version: z.literal(1),
  navigation: z.array(navItemConfigSchema),
  dashboard: z.object({
    tiles: z.array(dashboardTileConfigSchema),
  }),
  addonPages: addonPagesSettingsSchema.default({ enabled: [], config: {} }),
  aiTiles: aiTilesSettingsSchema.default({ enabled: [], custom: [], layout: {} }),
})
export type CustomizationSettings = z.infer<typeof customizationSettingsSchema>

// Type exports for add-on pages and AI tiles
export type AddonPageId = z.infer<typeof addonPagesSettingsSchema>['enabled'][number]
export type AITileId = z.infer<typeof aiTilesSettingsSchema>['enabled'][number]
export type CustomAITile = z.infer<typeof customAITileSchema>
export type AddonPagesSettings = z.infer<typeof addonPagesSettingsSchema>
export type AITilesSettings = z.infer<typeof aiTilesSettingsSchema>

// Navigation items that cannot be disabled (required for functionality)
export const REQUIRED_NAV_ITEMS: NavItemId[] = ['dashboard', 'contacts', 'settings']

// Navigation item metadata for display
export const NAV_ITEM_METADATA: Record<NavItemId, { name: string; description: string }> = {
  dashboard: { name: 'Dashboard', description: 'Overview and key metrics' },
  flora: { name: 'Flora', description: 'AI assistant and recommendations' },
  calendar: { name: 'Calendar', description: 'Schedule and events' },
  contacts: { name: 'Contacts', description: 'All people in your database' },
  donors: { name: 'Donors', description: 'Donor management and giving history' },
  prospects: { name: 'Prospects', description: 'Top giving potential contacts' },
  pipeline: { name: 'Pipeline', description: 'Major gift cultivation board' },
  donations: { name: 'Donations', description: 'Donation forms and tracking' },
  volunteers: { name: 'Volunteers', description: 'Volunteer management and shifts' },
  communications: { name: 'Communications', description: 'Email drafts and sent messages' },
  reports: { name: 'Reports', description: 'Analytics and exports' },
  settings: { name: 'Settings', description: 'Organization configuration' },
}

// Dashboard tile metadata for display
export const DASHBOARD_TILE_METADATA: Record<DashboardTileId, { name: string; description: string; category: 'stat' | 'action' | 'widget' | 'ai-insight' }> = {
  'stat-total-contacts': { name: 'Total Contacts', description: 'Count of all contacts', category: 'stat' },
  'stat-active-donors': { name: 'Active Donors', description: 'Donors who gave recently', category: 'stat' },
  'stat-volunteers': { name: 'Volunteers', description: 'Total volunteer count', category: 'stat' },
  'stat-emails-sent': { name: 'Emails Sent', description: 'Emails sent this month', category: 'stat' },
  'action-add-contact': { name: 'Add Contact', description: 'Quick action to add contact', category: 'action' },
  'action-record-gift': { name: 'Record Gift', description: 'Quick action to record gift', category: 'action' },
  'action-donation-forms': { name: 'Donation Forms', description: 'Quick action for donation forms', category: 'action' },
  'action-create-shift': { name: 'Create Shift', description: 'Quick action to create shift', category: 'action' },
  'widget-copilot': { name: 'AI Copilot', description: 'AI-powered recommendations', category: 'widget' },
  'widget-recent-activity': { name: 'Recent Activity', description: 'Latest contact activity', category: 'widget' },
  'widget-upcoming-shifts': { name: 'Upcoming Shifts', description: 'Next volunteer shifts', category: 'widget' },
  'widget-pending-drafts': { name: 'Pending Drafts', description: 'Emails awaiting review', category: 'widget' },
  'widget-my-tasks': { name: 'My Tasks', description: 'Your assigned tasks', category: 'widget' },
  'widget-donor-alerts': { name: 'Donor Alerts', description: 'At-risk donor warnings', category: 'widget' },
  'widget-todays-actions': { name: "Today's Actions", description: 'Daily action items', category: 'widget' },
  'ai-org-pulse': { name: 'Organization Pulse', description: 'AI-powered overview of your organization health', category: 'ai-insight' },
  'ai-donor-health': { name: 'Donor Health', description: 'Track donor engagement and identify at-risk relationships', category: 'ai-insight' },
  'ai-weekly-priorities': { name: 'Weekly Priorities', description: 'AI-generated action items for the week', category: 'ai-insight' },
}

// Default configuration (matches current hardcoded behavior)
export const DEFAULT_CUSTOMIZATION_SETTINGS: CustomizationSettings = {
  version: 1,
  navigation: [
    { id: 'dashboard', visible: true, order: 0 },
    { id: 'flora', visible: true, order: 1 },
    { id: 'calendar', visible: true, order: 2 },
    { id: 'contacts', visible: true, order: 3 },
    { id: 'donors', visible: true, order: 4 },
    { id: 'prospects', visible: true, order: 5 },
    { id: 'pipeline', visible: true, order: 6 },
    { id: 'donations', visible: true, order: 7 },
    { id: 'volunteers', visible: true, order: 8 },
    { id: 'communications', visible: true, order: 9 },
    { id: 'reports', visible: true, order: 10 },
    { id: 'settings', visible: true, order: 11 },
  ],
  dashboard: {
    tiles: [
      { id: 'stat-total-contacts', visible: true, order: 0 },
      { id: 'stat-active-donors', visible: true, order: 1 },
      { id: 'stat-volunteers', visible: true, order: 2 },
      { id: 'stat-emails-sent', visible: true, order: 3 },
      { id: 'action-add-contact', visible: true, order: 4 },
      { id: 'action-record-gift', visible: true, order: 5 },
      { id: 'action-donation-forms', visible: true, order: 6 },
      { id: 'action-create-shift', visible: true, order: 7 },
      { id: 'widget-copilot', visible: true, order: 8 },
      { id: 'widget-recent-activity', visible: true, order: 9 },
      { id: 'widget-upcoming-shifts', visible: true, order: 10 },
      { id: 'widget-pending-drafts', visible: true, order: 11 },
      { id: 'widget-my-tasks', visible: true, order: 12 },
      { id: 'widget-donor-alerts', visible: true, order: 13 },
      { id: 'widget-todays-actions', visible: true, order: 14 },
      { id: 'ai-org-pulse', visible: true, order: 15 },
      { id: 'ai-donor-health', visible: true, order: 16 },
      { id: 'ai-weekly-priorities', visible: true, order: 17 },
    ],
  },
  addonPages: {
    enabled: [],
    config: {},
  },
  aiTiles: {
    enabled: [],
    custom: [],
    layout: {},
  },
}
