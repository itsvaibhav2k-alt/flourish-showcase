import { z } from 'zod'

// Voice profile schema
export const voiceProfileSchema = z.object({
  voice_summary: z.string().nullable().optional(),
  voice_formality: z.enum(['casual', 'moderate', 'formal']).nullable().optional(),
  voice_warmth: z.number().min(1).max(10).nullable().optional(),
  voice_signature_phrases: z.array(z.string()).nullable().optional(),
  voice_greeting_style: z.string().nullable().optional(),
  voice_closing_style: z.string().nullable().optional(),
  voice_tone_characteristics: z.array(z.string()).nullable().optional(),
  voice_trained_at: z.string().nullable().optional(),
  voice_trained_by: z.string().uuid().nullable().optional(),
})

// Snippet schema for reusable text
export const snippetSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
})

// Full organization schema
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1),
  public_slug: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  voice_samples: z.array(z.string()).nullable().optional(),
  voice_summary: z.string().nullable().optional(),
  voice_formality: z.enum(['casual', 'moderate', 'formal']).nullable().optional(),
  voice_warmth: z.number().min(1).max(10).nullable().optional(),
  voice_signature_phrases: z.array(z.string()).nullable().optional(),
  voice_greeting_style: z.string().nullable().optional(),
  voice_closing_style: z.string().nullable().optional(),
  voice_tone_characteristics: z.array(z.string()).nullable().optional(),
  voice_trained_at: z.string().nullable().optional(),
  voice_trained_by: z.string().uuid().nullable().optional(),
  tone_preset: z.enum(['warm', 'professional', 'casual', 'formal']).nullable().optional(),
  snippets: z.array(snippetSchema).nullable().optional(),
  ein: z.string().nullable().optional(),
  tax_exempt_status: z.string().nullable().optional(),
  tax_receipt_footer: z.string().nullable().optional(),
  created_at: z.string(),
})

// Schema for updating organization settings
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  public_slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

// Email settings schema (stored in settings JSONB field)
export const emailSettingsSchema = z.object({
  email_from: z.string().email('Invalid email address').optional(),
  email_signature: z.string().optional(),
  auto_send_confirmations: z.boolean().optional(),
  auto_send_reminders: z.boolean().optional(),
  review_thank_you: z.boolean().optional(),
  review_reengagement: z.boolean().optional(),
  reminder_hours_before: z.number().min(1).max(168).optional(), // 1 hour to 7 days
})

// Type exports
export type Organization = z.infer<typeof organizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type EmailSettings = z.infer<typeof emailSettingsSchema>
export type VoiceProfile = z.infer<typeof voiceProfileSchema>
export type Snippet = z.infer<typeof snippetSchema>
