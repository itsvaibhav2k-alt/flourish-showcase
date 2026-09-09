'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface AutomationSettings {
  autoThankYouEmails: boolean
  autoVolunteerReminders: boolean
  autoVolunteerConfirmations: boolean
  aiEmailGeneration: boolean
  reminderHoursBefore: number
}

/**
 * Get the current organization's automation settings.
 * These settings control whether certain emails are sent automatically or require manual review.
 */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  try {
    // Get current organization ID
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch automation settings
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(
        'auto_thank_you_emails, auto_volunteer_reminders, auto_volunteer_confirmations, ai_email_generation, reminder_hours_before'
      )
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching automation settings:', error)
      throw new Error(error.message)
    }

    // Return settings with defaults if not set
    return {
      autoThankYouEmails: organization.auto_thank_you_emails ?? false,
      autoVolunteerReminders: organization.auto_volunteer_reminders ?? true,
      autoVolunteerConfirmations: organization.auto_volunteer_confirmations ?? true,
      aiEmailGeneration: organization.ai_email_generation ?? true,
      reminderHoursBefore: organization.reminder_hours_before ?? 24,
    }
  } catch (error) {
    console.error('Error in getAutomationSettings:', error)
    // Return safe defaults on error
    return {
      autoThankYouEmails: false,
      autoVolunteerReminders: true,
      autoVolunteerConfirmations: true,
      aiEmailGeneration: true,
      reminderHoursBefore: 24,
    }
  }
}
