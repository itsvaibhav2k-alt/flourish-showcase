/**
 * Donations Module
 *
 * This module provides complete donation management functionality including:
 * - Donation form creation and management
 * - Online donation processing with Stripe
 * - Donation tracking and reporting
 * - Donor information collection
 * - Recurring donation support
 */

// Schemas
export type {
  DonationForm,
  CreateDonationFormInput,
  UpdateDonationFormInput,
  Donation,
  ProcessDonationInput,
  RecordDonationInput,
} from './schemas/donation.schema'

// Actions - Donation Forms
export { createDonationForm } from './actions/create-donation-form'
export { updateDonationForm } from './actions/update-donation-form'
export { deleteDonationForm } from './actions/delete-donation-form'

// Actions - Donation Processing
export { processDonation } from './actions/process-donation'
export { recordDonation, markDonationFailed } from './actions/record-donation'

// Queries - Donation Forms
export {
  getDonationForms,
  getDonationForm,
  getPublicDonationForm,
  getDonationFormBySlug,
} from './queries/get-donation-forms'

// Queries - Donations
export {
  getDonations,
  getDonation,
  getDonationStats,
} from './queries/get-donations'

export type {
  DonationFilters,
  DonationSort,
  GetDonationsParams,
  GetDonationsResult,
  DonationStats,
} from './queries/get-donations'

// Components
export { DonationFormBuilder } from './components/donation-form-builder'
export { DonationWidget } from './components/donation-widget'
export { DonationsTable } from './components/donations-table'
