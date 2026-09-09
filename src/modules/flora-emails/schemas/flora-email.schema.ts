import { z } from 'zod'

/**
 * Flora Email Template Types
 */
export type FloraEmailTemplate = 'thank-you' | 'appeal' | 're-engagement' | 'volunteer' | 'custom'

export const floraEmailTemplateSchema = z.enum(['thank-you', 'appeal', 're-engagement', 'volunteer', 'custom'])

/**
 * Custom email parameters schema
 */
export const customEmailParamsSchema = z.object({
  topic: z.string().min(10, 'Topic must be at least 10 characters'),
  keyPoints: z.array(z.string()).optional(),
  tone: z.enum(['warm', 'professional', 'casual', 'formal', 'spiritual', 'urgent']).optional(),
  callToAction: z.string().optional(),
  subjectHint: z.string().optional(),
})

export type CustomEmailParams = z.infer<typeof customEmailParamsSchema>

/**
 * Generation parameters for Flora emails
 */
export const generateFloraEmailParamsSchema = z.object({
  organizationId: z.string().uuid(),
  templateType: floraEmailTemplateSchema,
  recipientIds: z.array(z.string().uuid()).min(1, 'At least one recipient is required'),
  options: z.object({
    tone: z.enum(['warm', 'professional', 'casual', 'formal', 'spiritual', 'urgent']).optional(),
    includeCallToAction: z.boolean().optional(),
    campaignName: z.string().optional(),
    customInstructions: z.string().optional(),
  }).optional(),
  /** Custom email parameters for 'custom' template type */
  customParams: customEmailParamsSchema.optional(),
})

export type GenerateFloraEmailParams = z.infer<typeof generateFloraEmailParamsSchema>

/**
 * Email draft result
 */
export const emailDraftResultSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid(),
  subject: z.string(),
  body: z.string(),
  status: z.enum(['draft', 'pending', 'approved', 'sent', 'rejected']),
})

export type EmailDraftResult = z.infer<typeof emailDraftResultSchema>

/**
 * Template metadata
 */
export interface TemplateMetadata {
  id: FloraEmailTemplate
  name: string
  description: string
  icon: string
  color: string
  gradient: string
  useCases: string[]
}

export const TEMPLATE_METADATA: Record<FloraEmailTemplate, TemplateMetadata> = {
  'thank-you': {
    id: 'thank-you',
    name: 'Thank You',
    description: 'Express gratitude for donations and support',
    icon: 'Heart',
    color: 'text-rose-600',
    gradient: 'from-rose-50 to-pink-50',
    useCases: ['New gifts', 'Recurring donations', 'Major gifts', 'First-time donors'],
  },
  'appeal': {
    id: 'appeal',
    name: 'Fundraising Appeal',
    description: 'Request support for campaigns and programs',
    icon: 'Megaphone',
    color: 'text-violet-600',
    gradient: 'from-violet-50 to-purple-50',
    useCases: ['Annual campaigns', 'Emergency needs', 'Program funding', 'Year-end giving'],
  },
  're-engagement': {
    id: 're-engagement',
    name: 'Re-engagement',
    description: 'Reconnect with lapsed donors',
    icon: 'RefreshCw',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50',
    useCases: ['Lapsed donors', 'Inactive contacts', 'Renewal campaigns', 'Win-back'],
  },
  'volunteer': {
    id: 'volunteer',
    name: 'Volunteer',
    description: 'Communicate with volunteers about opportunities',
    icon: 'Users',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50',
    useCases: ['Recruitment', 'Appreciation', 'Event invites', 'Updates'],
  },
  'custom': {
    id: 'custom',
    name: 'Custom Email',
    description: 'Create fully custom emails with your own topic and key points',
    icon: 'Sparkles',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
    useCases: ['Events', 'Announcements', 'Newsletters', 'Any custom purpose'],
  },
}
