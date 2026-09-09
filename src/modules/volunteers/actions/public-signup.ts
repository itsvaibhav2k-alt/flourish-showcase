'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { inngest } from '@/lib/inngest/client'

/**
 * Schema for public volunteer signup
 * Used by unauthenticated volunteers signing up via public portal
 */
const publicSignupSchema = z.object({
  orgSlug: z.string().min(1),
  shiftId: z.string().uuid(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export type PublicSignupInput = z.infer<typeof publicSignupSchema>

export async function publicVolunteerSignup(input: PublicSignupInput) {
  try {
    const supabase = await createAdminClient()

    // Validate input
    const validated = publicSignupSchema.safeParse(input)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Invalid input'
      }
    }

    const { orgSlug, shiftId, firstName, lastName, email, phone, notes } = validated.data

    // Get organization by slug
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('public_slug', orgSlug)
      .single()

    if (orgError || !org) {
      return { success: false, error: 'Organization not found' }
    }

    // Check if shift exists and is public
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, capacity, status, title, is_public')
      .eq('id', shiftId)
      .eq('organization_id', org.id)
      .single()

    if (shiftError || !shift) {
      return { success: false, error: 'Shift not found' }
    }

    if (!shift.is_public) {
      return { success: false, error: 'This shift is not available for public signup' }
    }

    if (shift.status === 'cancelled') {
      return { success: false, error: 'This shift has been cancelled' }
    }

    if (shift.status === 'completed') {
      return { success: false, error: 'This shift has already been completed' }
    }

    // Find or create contact by email
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone')
      .eq('email', email.toLowerCase())
      .eq('organization_id', org.id)
      .maybeSingle()

    let contactId: string

    if (existingContact) {
      // Update existing contact if needed
      contactId = existingContact.id
      const updates: Record<string, any> = { is_volunteer: true }

      // Update phone if provided and different
      if (phone && phone !== existingContact.phone) {
        updates.phone = phone
      }

      await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          is_volunteer: true,
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        console.error('Error creating contact:', contactError)
        return { success: false, error: 'Failed to create volunteer profile' }
      }

      contactId = newContact.id
    }

    // Check if already signed up
    const { data: existingSignup } = await supabase
      .from('shift_signups')
      .select('id, status')
      .eq('shift_id', shiftId)
      .eq('contact_id', contactId)
      .in('status', ['confirmed', 'waitlisted'])
      .maybeSingle()

    if (existingSignup) {
      return {
        success: false,
        error: 'You are already signed up for this shift'
      }
    }

    // Count current confirmed signups
    const { count, error: countError } = await supabase
      .from('shift_signups')
      .select('id', { count: 'exact', head: true })
      .eq('shift_id', shiftId)
      .eq('status', 'confirmed')

    if (countError) {
      console.error('Error counting signups:', countError)
      return { success: false, error: 'Failed to check shift availability' }
    }

    // Determine signup status based on capacity
    const signupStatus = !shift.capacity || (count || 0) < shift.capacity ? 'confirmed' : 'waitlisted'

    // Create signup with notes in metadata
    const { data: signup, error: signupError } = await supabase
      .from('shift_signups')
      .insert({
        shift_id: shiftId,
        contact_id: contactId,
        status: signupStatus,
        no_show: false,
        confirmation_sent: false,
      })
      .select()
      .single()

    if (signupError) {
      console.error('Error creating signup:', signupError)
      return { success: false, error: 'Failed to complete signup' }
    }

    // Log activity if notes were provided
    if (notes) {
      await supabase
        .from('activities')
        .insert({
          organization_id: org.id,
          contact_id: contactId,
          activity_type: 'note',
          description: `Volunteer signup note: ${notes}`,
          metadata: {
            signup_id: signup.id,
            shift_id: shiftId,
            source: 'public_signup',
          },
        })
    }

    // Update shift status if now full
    if (signupStatus === 'confirmed' && shift.capacity && (count || 0) + 1 >= shift.capacity) {
      await supabase
        .from('shifts')
        .update({ status: 'full' })
        .eq('id', shiftId)
    }

    // Trigger volunteer signup event for confirmation email (non-blocking)
    try {
      await inngest.send({
        name: 'volunteer/signup',
        data: {
          signupId: signup.id,
          shiftId: shiftId,
          contactId: contactId,
          organizationId: org.id,
          status: signupStatus,
        },
      })
    } catch (inngestError) {
      console.warn('Failed to send Inngest event for volunteer signup:', inngestError)
    }

    return {
      success: true,
      data: {
        signupId: signup.id,
        status: signupStatus,
        shiftTitle: shift.title,
      }
    }
  } catch (error) {
    console.error('Unexpected error in public signup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
