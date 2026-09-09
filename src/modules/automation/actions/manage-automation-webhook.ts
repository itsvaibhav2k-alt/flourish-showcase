'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'

export async function deleteAutomationWebhook(
  webhookId: string
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
      .from('automation_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting webhook:', error)
      return { success: false, error: 'Failed to delete webhook' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete webhook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete webhook',
    }
  }
}

export async function toggleAutomationWebhookActive(
  webhookId: string,
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
      .from('automation_webhooks')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhookId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating webhook:', error)
      return { success: false, error: 'Failed to update webhook' }
    }

    return { success: true }
  } catch (error) {
    console.error('Toggle webhook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook',
    }
  }
}

export async function updateAutomationWebhookConfig(
  webhookId: string,
  config: Record<string, unknown>
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
      .from('automation_webhooks')
      .update({
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', webhookId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating webhook config:', error)
      return { success: false, error: 'Failed to update webhook' }
    }

    return { success: true }
  } catch (error) {
    console.error('Update webhook config error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook',
    }
  }
}
