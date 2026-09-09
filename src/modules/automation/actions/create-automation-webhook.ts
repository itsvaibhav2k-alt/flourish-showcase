'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import crypto from 'crypto'

interface CreateWebhookInput {
  name: string
  description?: string
  webhook_type: string
  rate_limit_per_minute?: number
  config?: Record<string, unknown>
}

interface AutomationWebhook {
  id: string
  name: string
  description: string | null
  webhook_token: string
  webhook_type: string
  config: Record<string, unknown>
  is_active: boolean
  rate_limit_per_minute: number
  last_used_at: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

export async function createAutomationWebhook(
  input: CreateWebhookInput
): Promise<{ success: boolean; data?: AutomationWebhook; error?: string }> {
  try {
    // Check permissions
    const userRole = await getCurrentUserRole()
    if (userRole !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    // Validate input
    if (!input.name || !input.webhook_type) {
      return { success: false, error: 'Name and webhook type are required' }
    }

    const validTypes = ['send_email', 'enroll_sequence', 'generate_custom_email', 'create_contact', 'update_contact']
    if (!validTypes.includes(input.webhook_type)) {
      return { success: false, error: 'Invalid webhook type' }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('automation_webhooks')
      .insert({
        organization_id: organizationId,
        name: input.name,
        description: input.description || null,
        webhook_token: token,
        webhook_type: input.webhook_type,
        config: input.config || {},
        rate_limit_per_minute: input.rate_limit_per_minute || 60,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating automation webhook:', error)
      return { success: false, error: 'Failed to create webhook' }
    }

    return { success: true, data: data as AutomationWebhook }
  } catch (error) {
    console.error('Create automation webhook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create webhook',
    }
  }
}
