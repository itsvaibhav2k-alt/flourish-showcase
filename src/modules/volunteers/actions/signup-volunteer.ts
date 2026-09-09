'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { createSignupSchema, type CreateSignupInput } from '../schemas/shift.schema'
import { revalidatePath } from 'next/cache'
import { inngest } from '@/lib/inngest/client'
import { logVolunteerActivity } from '@/lib/activity'

export async function signupVolunteer(input: CreateSignupInput) {
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
    const validated = createSignupSchema.safeParse(input)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid input' }
    }

    // Check if shift exists and get current signup count
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, capacity, status, title')
      .eq('id', validated.data.shift_id)
      .eq('organization_id', organizationId)
      .single()

    if (shiftError || !shift) {
      return { error: 'Shift not found' }
    }

    if (shift.status === 'cancelled') {
      return { error: 'This shift has been cancelled' }
    }

    if (shift.status === 'completed') {
      return { error: 'This shift has already been completed' }
    }

    // Check if contact is already signed up for this shift
    const { data: existingSignup } = await supabase
      .from('shift_signups')
      .select('id, status')
      .eq('shift_id', validated.data.shift_id)
      .eq('contact_id', validated.data.contact_id)
      .eq('organization_id', organizationId)
      .in('status', ['confirmed', 'waitlisted'])
      .maybeSingle()

    if (existingSignup) {
      return { error: 'Contact is already signed up for this shift' }
    }

    // Count current confirmed signups
    const { count, error: countError } = await supabase
      .from('shift_signups')
      .select('id', { count: 'exact', head: true })
      .eq('shift_id', validated.data.shift_id)
      .eq('status', 'confirmed')

    if (countError) {
      console.error('Error counting signups:', countError)
      return { error: 'Failed to check capacity' }
    }

    // Determine signup status based on capacity (null capacity = unlimited)
    const signupStatus = !shift.capacity || (count || 0) < shift.capacity ? 'confirmed' : 'waitlisted'

    // Create signup
    const { data: signup, error: signupError } = await supabase
      .from('shift_signups')
      .insert({
        shift_id: validated.data.shift_id,
        contact_id: validated.data.contact_id,
        status: signupStatus,
        no_show: false,
        confirmation_sent: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (signupError) {
      console.error('Error creating signup:', signupError)
      return { error: 'Failed to create signup' }
    }

    // Update contact's is_volunteer flag if not already set
    await supabase
      .from('contacts')
      .update({ is_volunteer: true })
      .eq('id', validated.data.contact_id)
      .eq('organization_id', organizationId)

    // Log activity
    await logVolunteerActivity({
      organizationId,
      contactId: validated.data.contact_id,
      shiftId: validated.data.shift_id,
      shiftTitle: shift.title,
      signupId: signup.id,
      action: 'signup',
    })

    // Update shift status if now full
    if (signupStatus === 'confirmed' && shift.capacity && (count || 0) + 1 >= shift.capacity) {
      await supabase
        .from('shifts')
        .update({
          status: 'full',
        })
        .eq('id', validated.data.shift_id)
    }

    // Trigger volunteer signup event via Inngest (non-blocking)
    try {
      await inngest.send({
        name: 'volunteer/signup',
        data: {
          signupId: signup.id,
          shiftId: validated.data.shift_id,
          contactId: validated.data.contact_id,
          organizationId,
          status: signupStatus,
        },
      })
    } catch (inngestError) {
      console.warn('Failed to send Inngest event for volunteer signup:', inngestError)
    }

    revalidatePath('/volunteers')
    revalidatePath('/volunteers/shifts')
    revalidatePath(`/volunteers/shifts/${validated.data.shift_id}`)
    revalidatePath(`/volunteers/${validated.data.contact_id}`)

    return { data: signup }
  } catch (error) {
    console.error('Unexpected error signing up volunteer:', error)
    return { error: 'An unexpected error occurred' }
  }
}
