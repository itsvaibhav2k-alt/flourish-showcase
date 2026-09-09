/**
 * Donors Module
 *
 * This module provides complete donor management functionality including:
 * - Gift tracking and recording
 * - Lapse risk calculation
 * - Donor segmentation
 * - Giving history
 * - Thank-you automation hooks
 */

// Actions
export { recordGift } from './actions/record-gift'
export { updateGift } from './actions/update-gift'
export { deleteGift } from './actions/delete-gift'
export { updateDonorInfo } from './actions/update-donor-info'

// Queries
export { getDonors } from './queries/get-donors'
export { getDonorStats } from './queries/get-donor-stats'
export { getGivingHistory } from './queries/get-giving-history'
export { getSegmentCounts } from './queries/get-segment-counts'
export { getDonorByToken } from './queries/get-donor-by-token'

// Services
export {
  calculateLapseRisk,
  getLapseRiskDescription,
  getLapseRiskActions,
} from './services/lapse-risk-calculator'

// Components
export { GiftForm } from './components/gift-form'
export { GivingHistory } from './components/giving-history'
export { DonorCard } from './components/donor-card'
export { LapseRiskBadge } from './components/lapse-risk-badge'
export { DonorsTable } from './components/donors-table'
export { GivingChart } from './components/giving-chart'
export { SegmentFilterPills } from './components/segment-filter-pills'
export { DonorStatsSparkline, StatCardWithSparkline } from './components/donor-stats-sparklines'
export { DonorPortal } from './components/donor-portal'
export { DonorInfoForm } from './components/donor-info-form'
export { GiftHistoryTable } from './components/gift-history-table'

// Types
export type { Gift, CreateGiftInput, UpdateGiftInput } from './schemas/gift.schema'
export type { DonorSegment, DonorWithStats } from './queries/get-donors'
export type { DonorStats } from './queries/get-donor-stats'
export type { LapseRisk, DonorGivingHistory } from './services/lapse-risk-calculator'
export type { MonthlyGiving, GivingHistoryData } from './queries/get-giving-history'
export type { SegmentCount } from './queries/get-segment-counts'
export type { DonorPortalData } from './queries/get-donor-by-token'
export type { UpdateDonorInfoInput, UpdateDonorInfoResult } from './actions/update-donor-info'
