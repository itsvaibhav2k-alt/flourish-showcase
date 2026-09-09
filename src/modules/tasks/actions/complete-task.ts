'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { completeTaskSchema, type CompleteTaskInput } from '../schemas/task.schema'
import { logActivity } from '@/lib/activity'

export type CompleteTaskResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server action to mark a task as completed
 * - Validates input
 * - Updates task status and completed_at timestamp
 * - Logs activity
 * - Revalidates paths
 */
export async function completeTask(input: CompleteTaskInput): Promise<CompleteTaskResult> {
  try {
    // Validate input
    const validatedData = completeTaskSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Get the task first to verify access and get contact_id for activity log
    const { data: task, error: taskError } = await supabase
      .from('contact_tasks')
      .select('id, contact_id, title')
      .eq('id', validatedData.taskId)
      .eq('organization_id', organizationId)
      .single()

    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }

    // Update task to completed
    const { error: updateError } = await supabase
      .from('contact_tasks')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', validatedData.taskId)

    if (updateError) {
      return { success: false, error: 'Failed to complete task' }
    }

    // Log activity
    await logActivity({
      organizationId,
      contactId: task.contact_id,
      activityType: 'task_completed',
      description: `Task completed: ${task.title}`,
      metadata: {
        task_id: task.id,
        task_title: task.title,
      },
    })

    // Revalidate relevant paths
    revalidatePath(`/contacts/${task.contact_id}`)
    revalidatePath('/contacts')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error completing task:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
