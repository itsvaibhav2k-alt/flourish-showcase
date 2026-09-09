'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { checkInSchema, type CheckInInput } from '../schemas/shift.schema'
import { revalidatePath } from 'next/cache'
import { inngest } from '@/lib/inngest/client'
import { logVolunteerActivity } from '@/lib/activity'

export async function checkInVolunteer(input: CheckInInput) {
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
    const validated = checkInSchema.safeParse(input)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid input' }
    }

    // Get signup with shift details
    const { data: signup, error: signupError } = await supabase
      .from('shift_signups')
      .select(`
        id,
        shift_id,
        contact_id,
        status,
        checked_in_at,
        shifts!inner (
          organization_id,
          start_time,
          end_time,
          title
        )
      `)
      .eq('id', validated.data.signup_id)
      .eq('shifts.organization_id', organizationId)
      .single()

    if (signupError || !signup) {
      return { error: 'Signup not found' }
    }

    if (signup.status !== 'confirmed') {
      return { error: 'Only confirmed signups can be checked in' }
    }

    const shift = Array.isArray(signup.shifts)
      ? signup.shifts[0]
      : signup.shifts

    if (!shift) {
      return { error: 'Shift not found' }
    }

    // Calculate hours if checking in
    let hoursLogged = validated.data.hours_logged
    if (validated.data.checked_in_at && !hoursLogged) {
      const shiftStart = new Date(shift.start_time)
      const shiftEnd = new Date(shift.end_time)
      const durationMs = shiftEnd.getTime() - shiftStart.getTime()
      hoursLogged = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimals
    }

    // Update signup
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (validated.data.checked_in_at !== undefined) {
      updateData.checked_in_at = validated.data.checked_in_at
    }

    if (hoursLogged !== undefined) {
      updateData.hours_logged = hoursLogged
    }

    if (validated.data.no_show !== undefined) {
      updateData.no_show = validated.data.no_show
      if (validated.data.no_show) {
        updateData.checked_in_at = null
        updateData.hours_logged = null
      }
    }

    const { data: updatedSignup, error: updateError } = await supabase
      .from('shift_signups')
      .update(updateData)
      .eq('id', validated.data.signup_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating signup:', updateError)
      return { error: 'Failed to update check-in status' }
    }

    // Log activity if checking in or marking no-show
    if (validated.data.checked_in_at || validated.data.no_show) {
      await logVolunteerActivity({
        organizationId,
        contactId: signup.contact_id,
        shiftId: signup.shift_id,
        shiftTitle: shift.title,
        signupId: validated.data.signup_id,
        action: validated.data.no_show ? 'no_show' : 'checkin',
        hoursLogged,
      })
    }

    // Trigger volunteer check-in event via Inngest (only for actual check-ins, not no-shows)
    if (validated.data.checked_in_at && !validated.data.no_show) {
      try {
        await inngest.send({
          name: 'volunteer/checkin',
          data: {
            signupId: validated.data.signup_id,
            shiftId: signup.shift_id,
            contactId: signup.contact_id,
            organizationId,
            checkedInAt: validated.data.checked_in_at,
            hoursLogged,
          },
        })
      } catch (inngestError) {
        console.warn('Failed to send Inngest event for volunteer check-in:', inngestError)
      }
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')
    revalidatePath(`/volunteers/shifts/${signup.shift_id}`)
    revalidatePath(`/volunteers/${signup.contact_id}`)

    return { data: updatedSignup }
  } catch (error) {
    console.error('Unexpected error checking in volunteer:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function cancelSignup(signupId: string) {
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

    // Get signup details
    const { data: signup, error: signupError } = await supabase
      .from('shift_signups')
      .select('id, shift_id, contact_id, status, shifts!inner(organization_id)')
      .eq('id', signupId)
      .eq('shifts.organization_id', organizationId)
      .single()

    if (signupError || !signup) {
      return { error: 'Signup not found' }
    }

    // Update signup status
    const { error: updateError } = await supabase
      .from('shift_signups')
      .update({
        status: 'cancelled',
      })
      .eq('id', signupId)

    if (updateError) {
      console.error('Error cancelling signup:', updateError)
      return { error: 'Failed to cancel signup' }
    }

    // If shift was full, update status back to open
    if (signup.status === 'confirmed') {
      const { data: shift } = await supabase
        .from('shifts')
        .select('id, capacity, status')
        .eq('id', signup.shift_id)
        .single()

      if (shift && shift.status === 'full') {
        await supabase
          .from('shifts')
          .update({
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', signup.shift_id)
      }
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')
    revalidatePath(`/volunteers/shifts/${signup.shift_id}`)
    revalidatePath(`/volunteers/${signup.contact_id}`)

    return { data: { cancelled: true } }
  } catch (error) {
    console.error('Unexpected error cancelling signup:', error)
    return { error: 'An unexpected error occurred' }
  }
}
