'use server'

/**
 * Update Copilot Action Status
 *
 * Server actions for completing, dismissing, and snoozing copilot actions
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export interface UpdateActionStatusResult {
  success: boolean
  error?: string
}

/**
 * Mark a copilot action as completed
 */
export async function completeAction(
  actionId: string,
  outcome?: string
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update action status
    const { error } = await supabase
      .from('copilot_actions')
      .update({
        completed_at: new Date().toISOString(),
        outcome: outcome || null,
      })
      .eq('id', actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error completing action:', error)
      return { success: false, error: error.message }
    }

    // Log activity
    const { data: action } = await supabase
      .from('copilot_actions')
      .select('contact_id, title, action_type')
      .eq('id', actionId)
      .single()

    if (action) {
      await supabase.from('activities').insert({
        organization_id: organizationId,
        contact_id: action.contact_id,
        activity_type: 'copilot_action_completed',
        description: `Completed copilot action: ${action.title}`,
        metadata: {
          actionId,
          actionType: action.action_type,
          outcome,
        },
      })
    }

    // Revalidate dashboard and copilot pages
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in completeAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Mark a copilot action as dismissed
 */
export async function dismissAction(
  actionId: string
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update action status
    const { error } = await supabase
      .from('copilot_actions')
      .update({
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error dismissing action:', error)
      return { success: false, error: error.message }
    }

    // Revalidate dashboard and copilot pages
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in dismissAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Snooze a copilot action (dismiss and potentially regenerate later)
 */
export async function snoozeAction(
  actionId: string,
  snoozeDays: number = 7
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // For now, we'll dismiss the action
    // In the future, could add a snooze_until field to regenerate
    const snoozeUntil = new Date()
    snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays)

    const { error } = await supabase
      .from('copilot_actions')
      .update({
        dismissed_at: new Date().toISOString(),
        outcome: `Snoozed until ${snoozeUntil.toISOString()}`,
      })
      .eq('id', actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error snoozing action:', error)
      return { success: false, error: error.message }
    }

    // Revalidate dashboard and copilot pages
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in snoozeAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Undo action status (reopen a completed or dismissed action)
 */
export async function reopenAction(
  actionId: string
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Clear completed_at and dismissed_at
    const { error } = await supabase
      .from('copilot_actions')
      .update({
        completed_at: null,
        dismissed_at: null,
        outcome: null,
      })
      .eq('id', actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error reopening action:', error)
      return { success: false, error: error.message }
    }

    // Revalidate dashboard and copilot pages
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in reopenAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a copilot action permanently
 */
export async function deleteAction(
  actionId: string
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('copilot_actions')
      .delete()
      .eq('id', actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting action:', error)
      return { success: false, error: error.message }
    }

    // Revalidate dashboard and copilot pages
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Bulk complete multiple actions
 */
export async function bulkCompleteActions(
  actionIds: string[],
  outcome?: string
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('copilot_actions')
      .update({
        completed_at: new Date().toISOString(),
        outcome: outcome || null,
      })
      .in('id', actionIds)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error bulk completing actions:', error)
      return { success: false, error: error.message }
    }

    // Revalidate
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in bulkCompleteActions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Bulk dismiss multiple actions
 */
export async function bulkDismissActions(
  actionIds: string[]
): Promise<UpdateActionStatusResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('copilot_actions')
      .update({
        dismissed_at: new Date().toISOString(),
      })
      .in('id', actionIds)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error bulk dismissing actions:', error)
      return { success: false, error: error.message }
    }

    // Revalidate
    revalidatePath('/dashboard')
    revalidatePath('/copilot')

    return { success: true }
  } catch (error) {
    console.error('Error in bulkDismissActions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
