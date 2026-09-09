'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export type DeleteWebhookResult = {
  success: boolean
  message: string
  error?: string
}

export async function deleteExternalWebhook(webhookId: string): Promise<DeleteWebhookResult> {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('external_form_webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error deleting webhook:', error)
    return {
      success: false,
      message: 'Failed to delete webhook',
      error: 'DELETE_ERROR',
    }
  }

  revalidatePath('/settings')

  return {
    success: true,
    message: 'Webhook deleted successfully',
  }
}

export async function toggleWebhookActive(
  webhookId: string,
  isActive: boolean
): Promise<DeleteWebhookResult> {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('external_form_webhooks')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', webhookId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error toggling webhook:', error)
    return {
      success: false,
      message: 'Failed to update webhook',
      error: 'UPDATE_ERROR',
    }
  }

  revalidatePath('/settings')

  return {
    success: true,
    message: isActive ? 'Webhook activated' : 'Webhook deactivated',
  }
}
