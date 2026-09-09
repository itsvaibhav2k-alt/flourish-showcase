/**
 * Activity Logging Types
 *
 * Centralized types for activity logging across the application
 */

export type ActivityType =
  | 'gift_recorded'
  | 'gift_updated'
  | 'gift_deleted'
  | 'gift_archived'
  | 'contact_created'
  | 'contact_updated'
  | 'contact_merged'
  | 'volunteer_signup'
  | 'volunteer_checkin'
  | 'volunteer_no_show'
  | 'volunteer_cancelled'
  | 'shift_created'
  | 'shift_updated'
  | 'email_sent'
  | 'email_draft_created'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'other'

export interface ActivityMetadata {
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>
  // Common metadata fields
  amount?: number
  gift_id?: string
  shift_id?: string
  signup_id?: string
  draft_id?: string
  email_type?: string
  hours_logged?: number
  changes?: Record<string, unknown>
  note_id?: string
  task_id?: string
  task_title?: string
  due_date?: string
}

export interface LogActivityParams {
  organizationId: string
  contactId: string
  activityType: ActivityType
  description: string
  metadata?: ActivityMetadata
  occurredAt?: Date | string
}
