/**
 * Communications Module
 *
 * Handles email drafts, AI-generated communications, and email sending.
 */

// Actions
export {
  sendEmail,
  sendBatchEmails,
  checkEmailDeliveryStatus,
  retrySendEmail,
  getEmailStats,
  type SendEmailParams,
  type SendEmailResult,
} from './actions/send-email'

export {
  approveDraft,
  approveBatchDrafts,
  getDraft,
  getPendingDrafts,
  getDraftStats,
  deleteDraft,
  type ApproveDraftParams,
  type ApproveDraftResult,
} from './actions/approve-draft'

// Queries
export {
  getDrafts,
  getDraftById,
  getDraftStats as queryGetDraftStats,
  type GetDraftsParams,
  type GetDraftsResult,
  type DraftStats,
} from './queries/get-drafts'
