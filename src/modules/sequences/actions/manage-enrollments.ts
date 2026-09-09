/**
 * Manage Enrollment Actions
 *
 * Server actions to enroll contacts and manage their enrollment status
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { EnrollContactSchema, type EnrollContactInput } from '../schemas/sequence.schema'

export type EnrollmentActionResult = {
  success: boolean
  enrollmentId?: string
  error?: string
}

/**
 * Enroll a contact in a sequence
 */
export async function enrollContact(
  input: EnrollContactInput
): Promise<EnrollmentActionResult> {
  try {
    // Validate input
    const validatedInput = EnrollContactSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Verify sequence belongs to organization and is active
    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('id, is_active')
      .eq('id', validatedInput.sequence_id)
      .eq('organization_id', organizationId)
      .single()

    if (seqError || !sequence) {
      return { success: false, error: 'Sequence not found' }
    }

    if (!sequence.is_active) {
      return { success: false, error: 'Cannot enroll in inactive sequence' }
    }

    // Verify contact belongs to organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedInput.contact_id)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Get first step timing
    const { data: firstStep } = await supabase
      .from('email_sequence_steps')
      .select('delay_days, delay_hours')
      .eq('sequence_id', validatedInput.sequence_id)
      .eq('step_order', 1)
      .single()

    // Calculate next step time
    const now = new Date()
    const nextStepAt = new Date(
      now.getTime() +
        (firstStep?.delay_days || 0) * 24 * 60 * 60 * 1000 +
        (firstStep?.delay_hours || 0) * 60 * 60 * 1000
    )

    // Create enrollment
    const { data, error } = await supabase
      .from('sequence_enrollments')
      .insert({
        organization_id: organizationId,
        sequence_id: validatedInput.sequence_id,
        contact_id: validatedInput.contact_id,
        trigger_event_id: validatedInput.trigger_event_id,
        trigger_event_type: validatedInput.trigger_event_type,
        current_step: 0,
        status: 'active',
        next_step_at: nextStepAt.toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error enrolling contact:', error)
      if (error.code === '23505') {
        return { success: false, error: 'Contact already enrolled in this sequence' }
      }
      return { success: false, error: 'Failed to enroll contact' }
    }

    return {
      success: true,
      enrollmentId: data.id,
    }
  } catch (error) {
    console.error('Enroll contact error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll contact',
    }
  }
}

/**
 * Pause an enrollment
 */
export async function pauseEnrollment(
  enrollmentId: string
): Promise<EnrollmentActionResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update enrollment status
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error pausing enrollment:', error)
      return { success: false, error: 'Failed to pause enrollment' }
    }

    return { success: true }
  } catch (error) {
    console.error('Pause enrollment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause enrollment',
    }
  }
}

/**
 * Resume a paused enrollment
 */
export async function resumeEnrollment(
  enrollmentId: string
): Promise<EnrollmentActionResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update enrollment status
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error resuming enrollment:', error)
      return { success: false, error: 'Failed to resume enrollment' }
    }

    return { success: true }
  } catch (error) {
    console.error('Resume enrollment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume enrollment',
    }
  }
}

/**
 * Cancel an enrollment
 */
export async function cancelEnrollment(
  enrollmentId: string,
  reason?: string
): Promise<EnrollmentActionResult> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Update enrollment status
    const { error } = await supabase
      .from('sequence_enrollments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error cancelling enrollment:', error)
      return { success: false, error: 'Failed to cancel enrollment' }
    }

    return { success: true }
  } catch (error) {
    console.error('Cancel enrollment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel enrollment',
    }
  }
}
