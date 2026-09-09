'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface ExternalWebhook {
  id: string
  name: string
  webhookToken: string
  fieldMapping: Record<string, string>
  isActive: boolean
  submissionCount: number
  lastSubmissionAt: string | null
  createdAt: string
}

/**
 * Get all external webhooks for the current organization
 */
export async function getExternalWebhooks(): Promise<ExternalWebhook[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('external_form_webhooks')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    // Return silently - table may not exist yet
    return []
  }

  return data.map((webhook) => ({
    id: webhook.id,
    name: webhook.name,
    webhookToken: webhook.webhook_token,
    fieldMapping: (webhook.field_mapping as Record<string, string>) || {},
    isActive: webhook.is_active ?? true,
    submissionCount: webhook.submission_count ?? 0,
    lastSubmissionAt: webhook.last_submission_at,
    createdAt: webhook.created_at ?? '',
  }))
}

/**
 * Get a single external webhook by its token (used by the webhook endpoint)
 */
export async function getExternalWebhookByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('external_form_webhooks')
    .select('*, organizations!inner(id, name)')
    .eq('webhook_token', token)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    fieldMapping: (data.field_mapping as Record<string, string>) || {},
    isActive: data.is_active,
  }
}
