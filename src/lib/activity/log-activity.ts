/**
 * Activity Logger
 *
 * Centralized utility for logging activities throughout the application.
 * This ensures consistent activity tracking for the contact timeline feature.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActivityType, LogActivityParams } from './types'

/**
 * Log an activity to the activities table
 *
 * @param params - Activity parameters
 * @returns Promise<boolean> - Success status
 *
 * @example
 * await logActivity({
 *   organizationId,
 *   contactId,
 *   activityType: 'gift_recorded',
 *   description: 'Donation of $100 received',
 *   metadata: { amount: 100, gift_id: 'abc-123' }
 * })
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const {
      organizationId,
      contactId,
      activityType,
      description,
      metadata = {},
      occurredAt = new Date(),
    } = params

    const supabase = await createClient()

    const { error } = await supabase.from('activities').insert({
      organization_id: organizationId,
      contact_id: contactId,
      activity_type: activityType,
      description,
      metadata: metadata as any,
      created_at: typeof occurredAt === 'string' ? occurredAt : occurredAt.toISOString(),
    })

    if (error) {
      console.error('Failed to log activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error logging activity:', error)
    return false
  }
}

/**
 * Log activity - required version that throws on failure
 * Use this for critical operations where audit trail is mandatory
 */
export async function logActivityRequired(
  organizationId: string,
  contactId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('activities').insert({
    organization_id: organizationId,
    contact_id: contactId,
    activity_type: activityType,
    description,
    metadata: (metadata || {}) as any,
  })

  if (error) {
    console.error('Critical activity logging failed:', error)
    throw new Error('Failed to log activity - operation aborted for data integrity')
  }
}

/**
 * Log multiple activities in batch
 *
 * @param activities - Array of activity parameters
 * @returns Promise<boolean> - Success status
 */
export async function logActivities(
  activities: LogActivityParams[]
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const records = activities.map(activity => ({
      organization_id: activity.organizationId,
      contact_id: activity.contactId,
      activity_type: activity.activityType,
      description: activity.description,
      metadata: (activity.metadata || {}) as any,
      created_at:
        typeof activity.occurredAt === 'string'
          ? activity.occurredAt
          : (activity.occurredAt || new Date()).toISOString(),
    }))

    const { error } = await supabase.from('activities').insert(records)

    if (error) {
      console.error('Failed to log activities:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error logging activities:', error)
    return false
  }
}

/**
 * Helper functions for common activity types
 */

export async function logGiftActivity(params: {
  organizationId: string
  contactId: string
  giftId: string
  amount: number
  giftType: string | null
  action?: 'recorded' | 'updated' | 'deleted' | 'archived'
}): Promise<boolean> {
  const { organizationId, contactId, giftId, amount, giftType, action = 'recorded' } = params
  const typeLabel = giftType || 'donation'

  const descriptions = {
    recorded: `Gift recorded: $${amount.toLocaleString()} (${typeLabel})`,
    updated: `Gift updated: $${amount.toLocaleString()} (${typeLabel})`,
    deleted: `Gift deleted: $${amount.toLocaleString()} (${typeLabel})`,
    archived: `Gift archived: $${amount.toLocaleString()} (${typeLabel})`,
  }

  const activityTypes = {
    recorded: 'gift_recorded' as const,
    updated: 'gift_updated' as const,
    deleted: 'gift_deleted' as const,
    archived: 'gift_archived' as const,
  }

  return logActivity({
    organizationId,
    contactId,
    activityType: activityTypes[action],
    description: descriptions[action],
    metadata: {
      gift_id: giftId,
      amount,
      gift_type: giftType,
    },
  })
}

export async function logVolunteerActivity(params: {
  organizationId: string
  contactId: string
  shiftId: string
  shiftTitle: string
  signupId?: string
  action: 'signup' | 'checkin' | 'no_show' | 'cancelled'
  hoursLogged?: number
}): Promise<boolean> {
  const { organizationId, contactId, shiftId, shiftTitle, signupId, action, hoursLogged } = params

  const descriptions = {
    signup: `Signed up for volunteer shift: ${shiftTitle}`,
    checkin: `Checked in for volunteer shift: ${shiftTitle}${hoursLogged ? ` (${hoursLogged} hours)` : ''}`,
    no_show: `No-show for volunteer shift: ${shiftTitle}`,
    cancelled: `Cancelled signup for volunteer shift: ${shiftTitle}`,
  }

  const activityTypes = {
    signup: 'volunteer_signup' as const,
    checkin: 'volunteer_checkin' as const,
    no_show: 'volunteer_no_show' as const,
    cancelled: 'volunteer_cancelled' as const,
  }

  return logActivity({
    organizationId,
    contactId,
    activityType: activityTypes[action],
    description: descriptions[action],
    metadata: {
      shift_id: shiftId,
      signup_id: signupId,
      hours_logged: hoursLogged,
    },
  })
}

export async function logEmailActivity(params: {
  organizationId: string
  contactId: string
  draftId: string
  emailType: string
  subject: string
  action?: 'draft_created' | 'sent'
}): Promise<boolean> {
  const { organizationId, contactId, draftId, emailType, subject, action = 'sent' } = params

  const descriptions = {
    draft_created: `Email draft created: ${emailType} - "${subject}"`,
    sent: `Email sent: ${emailType} - "${subject}"`,
  }

  const activityTypes = {
    draft_created: 'email_draft_created' as const,
    sent: 'email_sent' as const,
  }

  return logActivity({
    organizationId,
    contactId,
    activityType: activityTypes[action],
    description: descriptions[action],
    metadata: {
      draft_id: draftId,
      email_type: emailType,
      subject,
    },
  })
}

export async function logContactActivity(params: {
  organizationId: string
  contactId: string
  action: 'created' | 'updated'
  changes?: Record<string, unknown>
}): Promise<boolean> {
  const { organizationId, contactId, action, changes } = params

  const descriptions = {
    created: 'Contact created',
    updated: changes
      ? `Contact updated: ${Object.keys(changes).join(', ')}`
      : 'Contact updated',
  }

  const activityTypes = {
    created: 'contact_created' as const,
    updated: 'contact_updated' as const,
  }

  return logActivity({
    organizationId,
    contactId,
    activityType: activityTypes[action],
    description: descriptions[action],
    metadata: {
      changes,
    },
  })
}
