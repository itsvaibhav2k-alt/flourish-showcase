/**
 * Smart Ask Module
 *
 * This module provides AI-powered donation amount suggestions based on:
 * - Donor giving history (average, max, recent gifts)
 * - Giving potential scores (capacity, affinity, propensity)
 * - Recency, frequency, and gift growth trends
 * - Lapse risk adjustments
 *
 * Features:
 * - Calculate three suggested amounts: stretch, target, accessible
 * - Confidence scores and reasoning for each suggestion
 * - Organization-wide configuration
 * - Conversion tracking and analytics
 */

// Actions
export { calculateSmartAskAction } from './actions/calculate-smart-ask'
export { saveSmartAskConfig } from './actions/save-config'
export { recordSmartAskSuggestion } from './actions/record-suggestion'

// Queries
export { getSmartAskConfig, getDefaultSmartAskConfig } from './queries/get-smart-ask-config'
export { getSmartAskAnalytics } from './queries/get-smart-ask-analytics'

// Components
export { SmartAskPageWrapper as SmartAskPage } from './components/smart-ask-page-wrapper'
export { SmartAskPage as SmartAskPageClient } from './components/smart-ask-page'
export { AmountPreview } from './components/amount-preview'
export { AskAnalytics } from './components/ask-analytics'

// Types
export type {
  SmartAskConfig,
  CreateSmartAskConfigInput,
  SmartAskResult as SmartAskResultSchema,
  RecordSmartAskInput,
  CalculateSmartAskInput,
} from './schemas/smart-ask.schema'

export type { SmartAskAnalytics } from './queries/get-smart-ask-analytics'

export type {
  CalculateSmartAskActionResult,
} from './actions/calculate-smart-ask'

export type { SaveConfigResult } from './actions/save-config'
export type { RecordSuggestionResult } from './actions/record-suggestion'
