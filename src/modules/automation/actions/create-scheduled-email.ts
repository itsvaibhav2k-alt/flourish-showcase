'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'

interface CreateScheduledEmailInput {
  name: string
  description?: string
  email_type: string
  schedule_type: string
  next_run_at: string
  recipient_filter?: Record<string, unknown>
  custom_params?: Record<string, unknown>
}

interface ScheduledEmail {
  id: string
  name: string
  description: string | null
  email_type: string
  recipient_filter: Record<string, unknown>
  schedule_type: string
  cron_expression: string | null
  next_run_at: string | null
  last_run_at: string | null
  last_run_result: Record<string, unknown> | null
  is_active: boolean
  created_at: string
}

export async function createScheduledEmail(
  input: CreateScheduledEmailInput
): Promise<{ success: boolean; data?: ScheduledEmail; error?: string }> {
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
    if (!input.name || !input.email_type || !input.schedule_type || !input.next_run_at) {
      return { success: false, error: 'Name, email type, schedule type, and next run date are required' }
    }

    const validEmailTypes = ['thank_you', 'reengagement', 'volunteer_confirmation', 'volunteer_reminder', 'custom']
    if (!validEmailTypes.includes(input.email_type)) {
      return { success: false, error: 'Invalid email type' }
    }

    const validScheduleTypes = ['once', 'daily', 'weekly', 'monthly', 'cron']
    if (!validScheduleTypes.includes(input.schedule_type)) {
      return { success: false, error: 'Invalid schedule type' }
    }

    // Parse and validate the date
    const nextRunAt = new Date(input.next_run_at)
    if (isNaN(nextRunAt.getTime())) {
      return { success: false, error: 'Invalid date format' }
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('scheduled_emails')
      .insert({
        organization_id: organizationId,
        name: input.name,
        description: input.description || null,
        email_type: input.email_type,
        schedule_type: input.schedule_type,
        next_run_at: nextRunAt.toISOString(),
        recipient_filter: input.recipient_filter || { is_donor: true, limit: 50 },
        custom_params: input.custom_params || null,
        is_active: true,
        created_by: user?.id,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating scheduled email:', error)
      return { success: false, error: 'Failed to create scheduled email' }
    }

    return { success: true, data: data as ScheduledEmail }
  } catch (error) {
    console.error('Create scheduled email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scheduled email',
    }
  }
}
