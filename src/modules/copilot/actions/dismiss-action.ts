/**
 * Dismiss Copilot Action Server Action
 *
 * Marks an action as dismissed with an optional reason.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export interface DismissActionParams {
  actionId: string
  reason?: string // Optional reason for dismissal
}

export async function dismissAction(
  params: DismissActionParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update the action status
    const { error } = await supabase
      .from('copilot_actions')
      .update({
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
        dismiss_reason: params.reason || null,
      })
      .eq('id', params.actionId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error dismissing action:', error)
      return { success: false, error: 'Failed to dismiss action' }
    }

    // Revalidate dashboard to show updated actions
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in dismissAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
