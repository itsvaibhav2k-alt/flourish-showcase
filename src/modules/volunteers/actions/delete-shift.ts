'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'

export async function deleteShift(shiftId: string) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { error: 'No organization selected' }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'User not authenticated' }
    }

    // Verify shift belongs to organization
    const { data: existingShift, error: fetchError } = await supabase
      .from('shifts')
      .select('id, status')
      .eq('id', shiftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !existingShift) {
      return { error: 'Shift not found' }
    }

    // Check if shift has completed signups
    const { count } = await supabase
      .from('shift_signups')
      .select('id', { count: 'exact', head: true })
      .eq('shift_id', shiftId)
      .eq('status', 'confirmed')

    // If shift has signups, cancel instead of delete
    if (count && count > 0) {
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error cancelling shift:', error)
        return { error: 'Failed to cancel shift' }
      }

      revalidatePath('/volunteers')
      revalidatePath('/volunteers/shifts')

      return { data: { cancelled: true } }
    }

    // Delete shift if no signups
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting shift:', error)
      return { error: 'Failed to delete shift' }
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')

    return { data: { deleted: true } }
  } catch (error) {
    console.error('Unexpected error deleting shift:', error)
    return { error: 'An unexpected error occurred' }
  }
}
