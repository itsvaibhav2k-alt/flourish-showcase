import { z } from 'zod'

// Email draft schema
export const emailDraftSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  email_type: z.enum(['thank_you', 'reengagement', 'volunteer_confirmation', 'volunteer_reminder', 'impact_update']),
  trigger_event: z.string().nullable(),
  subject: z.string(),
  body: z.string(),
  status: z.enum(['pending', 'approved', 'sent', 'rejected']),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
  sent_at: z.string().nullable(),
  created_at: z.string(),
})

export type EmailDraft = z.infer<typeof emailDraftSchema>

// Extended type with joined contact data from queries
export type EmailDraftWithContact = EmailDraft & {
  contacts?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
}

// Helper function to determine if an email type requires review
export function requiresReview(emailType: string): boolean {
  const autoSendTypes = ['volunteer_confirmation', 'volunteer_reminder']
  return !autoSendTypes.includes(emailType)
}

// Helper to get email type display name
export function getEmailTypeLabel(emailType: string): string {
  const labels: Record<string, string> = {
    thank_you: 'Thank You',
    reengagement: 'Re-engagement',
    volunteer_confirmation: 'Volunteer Confirmation',
    volunteer_reminder: 'Volunteer Reminder',
    impact_update: 'Impact Update',
  }
  return labels[emailType] || emailType
}

// Helper to get email type badge color
export function getEmailTypeBadgeVariant(emailType: string): 'default' | 'secondary' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    thank_you: 'default',
    reengagement: 'secondary',
    volunteer_confirmation: 'outline',
    volunteer_reminder: 'outline',
    impact_update: 'default',
  }
  return variants[emailType] || 'default'
}

// Helper to get status badge variant
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'secondary',
    approved: 'default',
    sent: 'outline',
    rejected: 'destructive',
  }
  return variants[status] || 'default'
}
