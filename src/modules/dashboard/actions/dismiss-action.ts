'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

/**
 * Dismiss an action from Today's Actions widget
 *
 * @param actionKey - The unique key for the action (e.g., "donor-uuid-lapse", "pending-emails")
 * @returns Success status and optional error message
 */
export async function dismissAction(actionKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!actionKey || typeof actionKey !== 'string') {
      return { success: false, error: 'Invalid action key' }
    }

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Check if already dismissed
    const { data: existing } = await supabase
      .from('action_dismissals')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('action_key', actionKey)
      .single()

    if (existing) {
      return { success: true } // Already dismissed
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Insert dismissal record
    const { error: insertError } = await supabase
      .from('action_dismissals')
      .insert({
        organization_id: organizationId,
        action_key: actionKey,
        dismissed_by: user?.id,
      })

    if (insertError) {
      console.error('Error dismissing action:', insertError)
      return { success: false, error: 'Failed to dismiss action' }
    }

    // Revalidate the dashboard to refresh the actions
    revalidatePath('/(dashboard)', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in dismissAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
