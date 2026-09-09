/**
 * Flora Emails Hub Module
 *
 * AI-powered email composition interface for meaningful donor and volunteer communications
 */

export { FloraEmailsPage } from './components/flora-emails-page'
export { CustomEmailBuilder } from './components/custom-email-builder'
export { generateFloraEmail, sendFloraEmails, saveDraft, generateCustomEmail } from './actions'
export { getRecentFloraDrafts, getFloraEmailStats } from './queries'
export type { FloraEmailTemplate, GenerateFloraEmailParams, EmailDraftResult, CustomEmailParams } from './schemas/flora-email.schema'
export type { FloraEmailDraft, FloraEmailStats } from './queries'
export type { CustomEmailGenerateParams, GeneratedDraft } from './components/custom-email-builder'
