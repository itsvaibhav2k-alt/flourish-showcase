'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import { updateOrganizationSchema, emailSettingsSchema, type UpdateOrganizationInput, type EmailSettings } from '../schemas/organization'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Update organization basic settings (name).
 */
export async function updateOrganization(
  input: UpdateOrganizationInput
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update organization settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn('Permission denied: User attempted to update organization settings without admin role', { role })
      return {
        success: false,
        error: 'Permission denied. Only administrators can update organization settings.',
      }
    }

    // Validate input
    const validatedData = updateOrganizationSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.public_slug !== undefined) updateData.public_slug = validatedData.public_slug
    if (validatedData.settings !== undefined) updateData.settings = validatedData.settings

    // Update organization
    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization:', error)
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
    console.error('Error in updateOrganization:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization',
    }
  }
}

/**
 * Update email settings stored in the organization's settings JSONB field.
 */
export async function updateEmailSettings(
  emailSettings: EmailSettings
): Promise<ActionResult> {
  try {
    // Check user role - only admins can update email settings
    const role = await getCurrentUserRole()
    if (role !== 'admin') {
      console.warn('Permission denied: User attempted to update email settings without admin role', { role })
      return {
        success: false,
        error: 'Permission denied. Only administrators can update email settings.',
      }
    }

    // Validate email settings
    const validatedSettings = emailSettingsSchema.parse(emailSettings)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch current settings
    const { data: currentOrg, error: fetchError } = await supabase
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

    // Merge email settings into existing settings
    const currentSettings = (currentOrg.settings as Record<string, unknown>) || {}
    const updatedSettings = {
      ...currentSettings,
      ...validatedSettings,
    }

    // Update organization with merged settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating email settings:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Revalidate settings page
    revalidatePath('/settings')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateEmailSettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update email settings',
    }
  }
}
