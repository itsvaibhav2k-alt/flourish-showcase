'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { ContactTask } from '../schemas/task.schema'

export type TaskWithContact = ContactTask & {
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
}

export type GetTasksOptions = {
  contactId?: string
  assignedToCurrentUser?: boolean
  dueTodayOrOverdue?: boolean
  limit?: number
}

/**
 * Get tasks with flexible filtering options:
 * - For a specific contact
 * - Assigned to current user
 * - Due today or overdue
 */
export async function getTasks(options: GetTasksOptions = {}): Promise<TaskWithContact[]> {
  try {
    const {
      contactId,
      assignedToCurrentUser = false,
      dueTodayOrOverdue = false,
      limit,
    } = options

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Get current user if needed
    let currentUserId: string | null = null
    if (assignedToCurrentUser || dueTodayOrOverdue) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id || null
    }

    // Build query
    let query = supabase
      .from('contact_tasks')
      .select(`
        *,
        contact:contacts(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'OPEN')

    // Filter by contact
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    // Filter by assigned user
    if (assignedToCurrentUser && currentUserId) {
      query = query.eq('assigned_to', currentUserId)
    }

    // Filter by due date (today or overdue)
    if (dueTodayOrOverdue) {
      const today = new Date().toISOString().split('T')[0]
      query = query.lte('due_date', today)
    }

    // Order by due date (overdue first, then soonest)
    query = query.order('due_date', { ascending: true, nullsFirst: false })

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      throw new Error(error.message)
    }

    return (tasks || []) as TaskWithContact[]
  } catch (error) {
    console.error('Error in getTasks:', error)
    throw error
  }
}
