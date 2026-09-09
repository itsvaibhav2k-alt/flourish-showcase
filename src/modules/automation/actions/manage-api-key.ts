'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'

export async function deleteApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRole = await getCurrentUserRole()
    if (userRole !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting API key:', error)
      return { success: false, error: 'Failed to delete API key' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete API key error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete API key',
    }
  }
}

export async function toggleApiKeyActive(
  keyId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRole = await getCurrentUserRole()
    if (userRole !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating API key:', error)
      return { success: false, error: 'Failed to update API key' }
    }

    return { success: true }
  } catch (error) {
    console.error('Toggle API key error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update API key',
    }
  }
}
