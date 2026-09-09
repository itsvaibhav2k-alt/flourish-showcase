'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  fieldMapping: z.record(z.string(), z.string()).optional(),
})

export type CreateWebhookResult = {
  success: boolean
  message: string
  webhookToken?: string
  error?: string
}

export async function createExternalWebhook(formData: FormData): Promise<CreateWebhookResult> {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  // Validate input
  const rawData = {
    name: formData.get('name') as string,
    fieldMapping: {},
  }

  const validationResult = createWebhookSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      message: validationResult.error.issues[0].message,
      error: 'VALIDATION_ERROR',
    }
  }

  const { name, fieldMapping } = validationResult.data

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('external_form_webhooks')
    .insert({
      organization_id: organizationId,
      name,
      field_mapping: fieldMapping || {},
    })
    .select('webhook_token')
    .single()

  if (error) {
    console.error('Error creating webhook:', error)
    return {
      success: false,
      message: 'Failed to create webhook',
      error: 'INSERT_ERROR',
    }
  }

  revalidatePath('/settings')

  return {
    success: true,
    message: 'Webhook created successfully',
    webhookToken: data.webhook_token,
  }
}

export async function updateWebhookFieldMapping(
  webhookId: string,
  fieldMapping: Record<string, string>
): Promise<CreateWebhookResult> {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, message: 'No organization found', error: 'NO_ORG' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('external_form_webhooks')
    .update({
      field_mapping: fieldMapping,
      updated_at: new Date().toISOString(),
    })
    .eq('id', webhookId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error updating webhook field mapping:', error)
    return {
      success: false,
      message: 'Failed to update field mapping',
      error: 'UPDATE_ERROR',
    }
  }

  revalidatePath('/settings')

  return {
    success: true,
    message: 'Field mapping updated successfully',
  }
}
