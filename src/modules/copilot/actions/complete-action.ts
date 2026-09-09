/**
 * Complete Copilot Action Server Action
 *
 * Marks an action as completed and optionally records the outcome.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export interface CompleteActionParams {
  actionId: string
  outcome?: string // Optional description of what happened
}

export async function completeAction(
  params: CompleteActionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Get the action first to get contact_id
    const { data: action, error: fetchError } = await supabase
      .from('copilot_actions')
      .select('contact_id')
      .eq('id', params.actionId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !action) {
      return { success: false, error: 'Action not found' }
    }

    // Update the action status
    const { error: updateError } = await supabase
      .from('copilot_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: params.outcome || null,
      })
      .eq('id', params.actionId)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error completing action:', updateError)
      return { success: false, error: 'Failed to complete action' }
    }

    // Update contact's last_contacted_at (if contacts table has this field)
    // Note: This assumes contacts table has a last_contacted_at field
    // If not, this update will be skipped silently
    await supabase
      .from('contacts')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', action.contact_id)
      .eq('organization_id', organizationId)

    // Log activity
    await supabase.from('activities').insert({
      organization_id: organizationId,
      contact_id: action.contact_id,
      activity_type: 'copilot_action_completed',
      description: params.outcome || 'Completed copilot action',
      metadata: {
        actionId: params.actionId,
      },
    })

    // Revalidate dashboard to show updated actions
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in completeAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
