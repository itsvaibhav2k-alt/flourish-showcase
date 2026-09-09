'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import type { AutomationSettings } from '../queries/get-automation-settings'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Update a single automation setting for the current organization.
 * This allows for optimistic UI updates by updating one setting at a time.
 */
export async function updateAutomationSetting(
  key: keyof AutomationSettings,
  value: boolean | number
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update automation settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn('Permission denied: User attempted to update automation settings without admin role', { role })
      return {
        success: false,
        error: 'Permission denied. Only administrators can update automation settings.',
      }
    }

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Validate the key and value
    const validKeys: Record<keyof AutomationSettings, string> = {
      autoThankYouEmails: 'auto_thank_you_emails',
      autoVolunteerReminders: 'auto_volunteer_reminders',
      autoVolunteerConfirmations: 'auto_volunteer_confirmations',
      aiEmailGeneration: 'ai_email_generation',
      reminderHoursBefore: 'reminder_hours_before',
    }

    const dbColumn = validKeys[key]
    if (!dbColumn) {
      return {
        success: false,
        error: 'Invalid setting key',
      }
    }

    // Validate value type
    if (key === 'reminderHoursBefore') {
      if (typeof value !== 'number' || value < 1 || value > 168) {
        return {
          success: false,
          error: 'Reminder hours must be between 1 and 168',
        }
      }
    } else {
      if (typeof value !== 'boolean') {
        return {
          success: false,
          error: 'Setting value must be a boolean',
        }
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Update the specific column
    const { error } = await supabase
      .from('organizations')
      .update({ [dbColumn]: value })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating automation setting:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate settings page
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateAutomationSetting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting',
    }
  }
}

/**
 * Bulk update multiple automation settings at once.
 */
export async function updateAutomationSettings(
  settings: Partial<AutomationSettings>
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update automation settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn('Permission denied: User attempted to update automation settings without admin role', { role })
      return {
        success: false,
        error: 'Permission denied. Only administrators can update automation settings.',
      }
    }

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Map camelCase keys to snake_case database columns
    const updateData: Record<string, unknown> = {}

    if (settings.autoThankYouEmails !== undefined) {
      updateData.auto_thank_you_emails = settings.autoThankYouEmails
    }
    if (settings.autoVolunteerReminders !== undefined) {
      updateData.auto_volunteer_reminders = settings.autoVolunteerReminders
    }
    if (settings.autoVolunteerConfirmations !== undefined) {
      updateData.auto_volunteer_confirmations = settings.autoVolunteerConfirmations
    }
    if (settings.aiEmailGeneration !== undefined) {
      updateData.ai_email_generation = settings.aiEmailGeneration
    }
    if (settings.reminderHoursBefore !== undefined) {
      if (settings.reminderHoursBefore < 1 || settings.reminderHoursBefore > 168) {
        return {
          success: false,
          error: 'Reminder hours must be between 1 and 168',
        }
      }
      updateData.reminder_hours_before = settings.reminderHoursBefore
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: 'No settings to update',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Update the settings
    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating automation settings:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate settings page
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateAutomationSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    }
  }
}
