// Components
export { MatchingGiftsDashboard } from './components/matching-gifts-dashboard'

// Queries
export { getMatchingGiftStats, getMatchEligibleGifts } from './queries/get-matching-gift-stats'

// Actions
export { updateMatchingGiftStatus, recordMatchingGiftReceived, updateMatchingGiftSettings } from './actions/update-matching-gift'

// Schemas & Types
export type { MatchingGiftStatus, MatchingGiftData, MatchingGiftSummary, MatchEligibleGift } from './schemas/matching-gift.schema'
