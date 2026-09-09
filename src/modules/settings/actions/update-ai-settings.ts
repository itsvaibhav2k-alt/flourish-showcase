'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import type { Json } from '@/lib/supabase/types'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Valid AI setting keys that can be updated
 */
export type AISettingKey =
  | 'aiEmailGeneration'
  | 'autoThankYouEmails'
  | 'autoVolunteerReminders'
  | 'autoVolunteerConfirmations'
  | 'aiNextStepSuggestions'
  | 'voiceCallsEnabled'
  | 'autoThankYouCalls'
  | 'autoReengagementCalls'
  | 'voiceShiftReminders'

type JsonbMapping = { jsonb: true; path: string }
type ColumnMappingValue = string | JsonbMapping

/**
 * Mapping of camelCase keys to database column names
 * Note: aiNextStepSuggestions is stored in the settings JSONB field
 */
const COLUMN_MAPPING: Record<AISettingKey, ColumnMappingValue> = {
  aiEmailGeneration: 'ai_email_generation',
  autoThankYouEmails: 'auto_thank_you_emails',
  autoVolunteerReminders: 'auto_volunteer_reminders',
  autoVolunteerConfirmations: 'auto_volunteer_confirmations',
  aiNextStepSuggestions: { jsonb: true, path: 'ai_next_step_suggestions' },
  voiceCallsEnabled: 'voice_calls_enabled',
  autoThankYouCalls: 'auto_thank_you_calls',
  autoReengagementCalls: 'auto_reengagement_calls',
  voiceShiftReminders: 'voice_shift_reminders',
}

/**
 * Type guard to check if a column mapping is a JSONB mapping
 */
function isJsonbMapping(mapping: ColumnMappingValue): mapping is JsonbMapping {
  return typeof mapping === 'object' && 'jsonb' in mapping && mapping.jsonb === true
}

/**
 * Update a single AI setting for the current organization.
 * Only administrators can update these settings.
 *
 * @param key - The setting key to update
 * @param value - The new boolean value
 * @returns ActionResult indicating success or failure
 */
export async function updateAISetting(
  key: AISettingKey,
  value: boolean
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update AI settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to update AI settings without admin role',
        { role }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can update AI settings.',
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

    // Validate the key
    const columnMapping = COLUMN_MAPPING[key]
    if (!columnMapping) {
      return {
        success: false,
        error: 'Invalid setting key',
      }
    }

    // Validate value type
    if (typeof value !== 'boolean') {
      return {
        success: false,
        error: 'Setting value must be a boolean',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Handle JSONB field differently
    if (isJsonbMapping(columnMapping)) {
      // For JSONB settings, we need to merge with existing settings
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        console.error('Error fetching organization settings:', fetchError)
        return {
          success: false,
          error: fetchError.message,
        }
      }

      const existingSettings = (org?.settings as Record<string, Json>) || {}
      const updatedSettings: Record<string, Json> = {
        ...existingSettings,
        [columnMapping.path]: value,
      }

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organizationId)

      if (error) {
        console.error('Error updating AI setting (JSONB):', error)
        return {
          success: false,
          error: error.message,
        }
      }
    } else {
      // For direct column updates
      const { error } = await supabase
        .from('organizations')
        .update({ [columnMapping]: value })
        .eq('id', organizationId)

      if (error) {
        console.error('Error updating AI setting:', error)
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // Revalidate AI settings page
    revalidatePath('/settings/ai')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateAISetting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting',
    }
  }
}

/**
 * Bulk update multiple AI settings at once.
 * Only administrators can update these settings.
 *
 * @param settings - Partial object of AI settings to update
 * @returns ActionResult indicating success or failure
 */
export async function updateAISettings(
  settings: Partial<Record<AISettingKey, boolean>>
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update AI settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn(
        'Permission denied: User attempted to update AI settings without admin role',
        { role }
      )
      return {
        success: false,
        error: 'Permission denied. Only administrators can update AI settings.',
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

    // Validate all values are booleans
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'boolean') {
        return {
          success: false,
          error: `Invalid value for ${key}: must be a boolean`,
        }
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Separate direct columns from JSONB fields
    const directUpdates: Record<string, boolean> = {}
    const jsonbUpdates: Record<string, boolean> = {}

    for (const [key, value] of Object.entries(settings)) {
      const columnMapping = COLUMN_MAPPING[key as AISettingKey]
      if (!columnMapping) {
        continue // Skip unknown keys
      }

      if (isJsonbMapping(columnMapping)) {
        jsonbUpdates[columnMapping.path] = value
      } else {
        directUpdates[columnMapping] = value
      }
    }

    // Build the final update object
    let updateData: Record<string, boolean | Json> = { ...directUpdates }

    // Handle JSONB updates if any
    if (Object.keys(jsonbUpdates).length > 0) {
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        console.error('Error fetching organization settings:', fetchError)
        return {
          success: false,
          error: fetchError.message,
        }
      }

      const existingSettings = (org?.settings as Record<string, Json>) || {}
      const updatedSettings: Record<string, Json> = {
        ...existingSettings,
        ...jsonbUpdates,
      }

      // Include JSONB update with direct updates
      updateData = { ...directUpdates, settings: updatedSettings }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: 'No valid settings to update',
      }
    }

    // Update organization
    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating AI settings:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate AI settings page
    revalidatePath('/settings/ai')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateAISettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    }
  }
}
