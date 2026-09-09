'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTaskSchema, type CreateTaskInput } from '../schemas/task.schema'
import { logActivity } from '@/lib/activity'

export type CreateTaskResult =
  | { success: true; taskId: string }
  | { success: false; error: string }

/**
 * Server action to create a new task for a contact
 * - Validates input
 * - Inserts task into Supabase
 * - Logs activity
 * - Revalidates paths
 */
export async function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  try {
    // Validate input
    const validatedData = createTaskSchema.parse(input)

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

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedData.contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Insert task (assigned to current user by default)
    const { data: task, error: taskError } = await supabase
      .from('contact_tasks')
      .insert({
        organization_id: organizationId,
        contact_id: validatedData.contactId,
        title: validatedData.title,
        description: validatedData.description,
        due_date: validatedData.dueDate,
        assigned_to: user.id,
        created_by: user.id,
        status: 'OPEN',
      })
      .select('id')
      .single()

    if (taskError || !task) {
      return { success: false, error: 'Failed to create task' }
    }

    // Log activity
    await logActivity({
      organizationId,
      contactId: validatedData.contactId,
      activityType: 'task_created',
      description: `Task created: ${validatedData.title}`,
      metadata: {
        task_id: task.id,
        task_title: validatedData.title,
        due_date: validatedData.dueDate,
      },
    })

    // Revalidate relevant paths
    revalidatePath(`/contacts/${validatedData.contactId}`)
    revalidatePath('/contacts')
    revalidatePath('/dashboard')

    return { success: true, taskId: task.id }
  } catch (error) {
    console.error('Error creating task:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
