/**
 * AI Fundraising Copilot - Index
 *
 * Central exports for the copilot engine
 */

// Action Generator
export {
  generateCopilotAction,
  batchGenerateCopilotActions,
  selectTopPriorityDonors,
} from './action-generator'
export type { CopilotAction, CopilotActionType } from './action-generator'

// Donor Scorer
export {
  calculateDonorScore,
  batchCalculateDonorScores,
} from './donor-scorer'
export type { DonorScore } from './donor-scorer'

// Prompts
export {
  getCopilotSystemPrompt,
  getCopilotUserPrompt,
  getBatchCopilotPrompt,
  getCopilotActionExamples,
} from './prompts'
