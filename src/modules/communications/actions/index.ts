/**
 * Communications Actions Index
 *
 * Centralized exports for all communication-related server actions.
 */

// Voice Training
export {
  trainVoice,
  getVoiceProfile,
  clearVoiceProfile,
} from './train-voice'
export type { TrainVoiceResult } from './train-voice'

// Voice Samples Management
export {
  addVoiceSample,
  removeVoiceSample,
} from './manage-voice-samples'
export type {
  AddVoiceSampleResult,
  RemoveVoiceSampleResult,
} from './manage-voice-samples'

// Draft Generation
export { generateDraft } from './generate-draft'
export type {
  EmailType,
  GenerateDraftParams,
  GenerateDraftResult,
} from './generate-draft'

// Draft Approval
export {
  approveDraft,
  getDraft,
  getPendingDrafts,
  getDraftStats,
  deleteDraft,
} from './approve-draft'
export type { ApproveDraftParams, ApproveDraftResult } from './approve-draft'

// Email Sending
export {
  sendEmail,
  sendBatchEmails,
  getEmailStats,
} from './send-email'
export type { SendEmailParams, SendEmailResult } from './send-email'
