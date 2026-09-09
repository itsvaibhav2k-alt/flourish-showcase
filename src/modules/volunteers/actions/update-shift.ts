'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { updateShiftSchema, type UpdateShiftInput } from '../schemas/shift.schema'
import { revalidatePath } from 'next/cache'

export async function updateShift(shiftId: string, input: UpdateShiftInput) {
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

    // Validate input
    const validated = updateShiftSchema.safeParse(input)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid input' }
    }

    // Check if times are valid (if both provided)
    if (validated.data.start_time && validated.data.end_time) {
      if (new Date(validated.data.end_time) <= new Date(validated.data.start_time)) {
        return { error: 'End time must be after start time' }
      }
    }

    // Verify shift belongs to organization
    const { data: existingShift, error: fetchError } = await supabase
      .from('shifts')
      .select('id, organization_id, capacity')
      .eq('id', shiftId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !existingShift) {
      return { error: 'Shift not found' }
    }

    // If capacity is being reduced, check current signup count
    if (validated.data.capacity && existingShift.capacity && validated.data.capacity < existingShift.capacity) {
      const { count } = await supabase
        .from('shift_signups')
        .select('id', { count: 'exact', head: true })
        .eq('shift_id', shiftId)
        .eq('status', 'confirmed')

      if (count && count > validated.data.capacity) {
        return { error: `Cannot reduce capacity below current signups (${count})` }
      }
    }

    // Update shift
    const { data: shift, error } = await supabase
      .from('shifts')
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating shift:', error)
      return { error: 'Failed to update shift' }
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')
    revalidatePath(`/volunteers/shifts/${shiftId}`)

    return { data: shift }
  } catch (error) {
    console.error('Unexpected error updating shift:', error)
    return { error: 'An unexpected error occurred' }
  }
}
