/**
 * AI Library Index
 *
 * Centralized exports for the Flourish AI Communication Engine.
 */

// Claude API
export {
  generateWithCaching,
  generateSimple,
  analyzeVoiceSamples,
  MODELS,
} from './claude'
export type {
  ClaudeModel,
  GenerateParams,
  GenerateResponse,
  VoiceAnalysis,
} from './claude'

// Context Building
export {
  buildDonorContext,
  buildVolunteerContext,
  serializeContext,
} from './context/builder'
export type {
  DonorContext,
  VolunteerContext,
  GiftContext,
} from './context/builder'

// Prompts
export {
  getThankYouSystemPrompt,
  getThankYouUserPrompt,
  getThankYouExamples,
} from './prompts/thank-you'
export {
  getReengagementSystemPrompt,
  getReengagementUserPrompt,
  getReengagementExamples,
} from './prompts/reengagement'
export {
  getVolunteerConfirmationSystemPrompt,
  getVolunteerConfirmationUserPrompt,
  getVolunteerReminderSystemPrompt,
  getVolunteerReminderUserPrompt,
  getVolunteerThankYouSystemPrompt,
  getVolunteerThankYouUserPrompt,
  getVolunteerExamples,
} from './prompts/volunteer'
export {
  VOICE_ANALYSIS_PROMPT,
  buildVoiceAnalysisPrompt,
  getVoiceInstructions,
} from './prompts/voice-analysis'
export type { VoiceProfile } from './prompts/voice-analysis'

// Cost Tracking
export {
  trackUsage,
  calculateCost,
  getMonthlyUsage,
  getUsageByModel,
  checkUsageLimit,
  formatCost,
  formatTokens,
} from './cost-tracker'
export type { UsageParams } from './cost-tracker'

// Fallback Templates
export {
  getFallbackTemplate,
  shouldUseFallback,
  logFallbackUsage,
  validateTemplateVariables,
} from './fallback'
export type { EmailType, FallbackTemplate } from './fallback'

// Next Step Suggestions
export {
  suggestNextStep,
} from './suggest-next-step'
export type { NextStepSuggestion } from './suggest-next-step'

// Flora Tooltips
export {
  floraTooltips,
  getFloraTooltip,
  getFloraTooltipKeys,
  isFloraTooltipKey,
} from './flora-tooltips'
export type { FloraTooltip, FloraTooltipKey } from './flora-tooltips'

// AI Fundraising Copilot
export {
  generateCopilotAction,
  batchGenerateCopilotActions,
  calculateDonorScore,
  batchCalculateDonorScores,
  getCopilotSystemPrompt,
  getCopilotUserPrompt,
  getBatchCopilotPrompt,
  getCopilotActionExamples,
} from './copilot'
export type { CopilotAction, CopilotActionType, DonorScore } from './copilot'
