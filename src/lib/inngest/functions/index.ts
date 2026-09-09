import { generateThankYou } from './generate-thank-you'
import { sendApprovedEmails, sendBatchEmails } from './send-approved-emails'
import { calculateLapseRiskJob } from './calculate-lapse-risk'
import { sendVolunteerReminders } from './send-volunteer-reminders'
import { sendVolunteerThankYou } from './send-volunteer-thankyou'
import { updateContactStats } from './update-contact-stats'
import { handleVolunteerSignup } from './handle-volunteer-signup'
import { handleVolunteerCheckin } from './handle-volunteer-checkin'
import { generateCopilotActions } from './generate-copilot-actions'
import {
  refreshAITilesCron,
  refreshAITilesEvent,
  refreshSingleTile,
} from './refresh-ai-tiles'
import { processSequenceSteps } from './process-sequence-steps'
import {
  autoEnrollOnGift,
  autoEnrollOnVolunteerSignup,
  autoEnrollOnLapseRisk,
} from './auto-enroll-sequences'
import {
  recalculateGivingScores,
  recalculateSingleContactScore,
} from './recalculate-giving-scores'
import {
  processScheduledEmails,
  triggerScheduledEmail,
} from './process-scheduled-emails'
import { cleanupRateLimitEntries } from './cleanup-rate-limits'
import { initiateVoiceCall } from './initiate-voice-call'
import { processCallTranscript } from './process-call-transcript'
import { initiateReengagementCall } from './initiate-reengagement-call'
import { pollCallStatus } from './poll-call-status'
import { handleCallCompleted } from './handle-call-completed'
import { reconcileRetellCalls } from './reconcile-retell-calls'
import { processCallQueue } from './process-call-queue'
import { autoFlagMatchingGifts } from './auto-flag-matching-gifts'
import { generateBatchTaxReceipts } from './generate-batch-tax-receipts'
import { checkSponsorshipRenewals } from './check-sponsorship-renewals'

// Export all Inngest functions
export const functions = [
  generateThankYou,
  sendApprovedEmails,
  sendBatchEmails,
  calculateLapseRiskJob,
  sendVolunteerReminders,
  sendVolunteerThankYou,
  updateContactStats,
  handleVolunteerSignup,
  handleVolunteerCheckin,
  generateCopilotActions,
  refreshAITilesCron,
  refreshAITilesEvent,
  refreshSingleTile,
  processSequenceSteps,
  autoEnrollOnGift,
  autoEnrollOnVolunteerSignup,
  autoEnrollOnLapseRisk,
  recalculateGivingScores,
  recalculateSingleContactScore,
  processScheduledEmails,
  triggerScheduledEmail,
  // Voice call functions
  initiateVoiceCall,
  processCallTranscript,
  initiateReengagementCall,
  pollCallStatus,
  handleCallCompleted,
  reconcileRetellCalls,
  processCallQueue,
  autoFlagMatchingGifts,
  // Maintenance jobs
  cleanupRateLimitEntries,
  // Tax receipt generation
  generateBatchTaxReceipts,
  // Sponsorship renewals
  checkSponsorshipRenewals,
]
