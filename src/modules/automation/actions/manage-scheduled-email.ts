'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId, getCurrentUserRole } from '@/lib/auth/organization'
import { inngest } from '@/lib/inngest/client'

export async function deleteScheduledEmail(
  id: string
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
      .from('scheduled_emails')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting scheduled email:', error)
      return { success: false, error: 'Failed to delete scheduled email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete scheduled email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete scheduled email',
    }
  }
}

export async function toggleScheduledEmailActive(
  id: string,
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

    const updates: Record<string, unknown> = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    // If reactivating and next_run_at is in the past, update it
    if (isActive) {
      const { data: scheduled } = await supabase
        .from('scheduled_emails')
        .select('next_run_at, schedule_type')
        .eq('id', id)
        .single()

      if (scheduled?.next_run_at) {
        const nextRun = new Date(scheduled.next_run_at)
        if (nextRun < new Date()) {
          // Calculate new next run based on schedule type
          const now = new Date()
          let newNextRun = now

          switch (scheduled.schedule_type) {
            case 'daily':
              newNextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000)
              break
            case 'weekly':
              newNextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              break
            case 'monthly':
              newNextRun = new Date(now)
              newNextRun.setMonth(newNextRun.getMonth() + 1)
              break
            default:
              // For once or cron, keep it as is (will run soon)
              newNextRun = new Date(now.getTime() + 60 * 1000) // 1 minute from now
          }

          updates.next_run_at = newNextRun.toISOString()
        }
      }
    }

    const { error } = await supabase
      .from('scheduled_emails')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating scheduled email:', error)
      return { success: false, error: 'Failed to update scheduled email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Toggle scheduled email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update scheduled email',
    }
  }
}

export async function triggerScheduledEmail(
  id: string
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

    // Trigger the Inngest event
    await inngest.send({
      name: 'scheduled-email/trigger',
      data: {
        scheduledEmailId: id,
        organizationId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Trigger scheduled email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger scheduled email',
    }
  }
}

export async function updateScheduledEmail(
  id: string,
  updates: {
    name?: string
    description?: string
    email_type?: string
    schedule_type?: string
    next_run_at?: string
    recipient_filter?: Record<string, unknown>
    custom_params?: Record<string, unknown>
  }
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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.email_type !== undefined) updateData.email_type = updates.email_type
    if (updates.schedule_type !== undefined) updateData.schedule_type = updates.schedule_type
    if (updates.next_run_at !== undefined) updateData.next_run_at = new Date(updates.next_run_at).toISOString()
    if (updates.recipient_filter !== undefined) updateData.recipient_filter = updates.recipient_filter
    if (updates.custom_params !== undefined) updateData.custom_params = updates.custom_params

    const { error } = await supabase
      .from('scheduled_emails')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating scheduled email:', error)
      return { success: false, error: 'Failed to update scheduled email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Update scheduled email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update scheduled email',
    }
  }
}
