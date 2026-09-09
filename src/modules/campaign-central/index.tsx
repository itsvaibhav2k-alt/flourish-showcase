/**
 * Campaign Central Module
 *
 * Unified dashboard for fundraising campaigns with goals, progress tracking, and donor segments
 */

// Re-export main page component
export { CampaignCentralPage } from './components/campaign-central-page'

// Re-export components
export { CampaignCard } from './components/campaign-card'
export { CampaignDetailView } from './components/campaign-detail-view'
export { CampaignFormModal } from './components/campaign-form-modal'
export { CampaignStats } from './components/campaign-stats'
export { GiftAttributionModal } from './components/gift-attribution-modal'
export { ProgressThermometer } from './components/progress-thermometer'

// Re-export schemas
export * from './schemas/campaign.schema'

// Re-export queries
export * from './queries'

// Re-export actions
export * from './actions'
