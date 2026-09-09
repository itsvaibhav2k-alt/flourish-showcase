/**
 * Auto-Enroll in Sequences
 *
 * Event handlers to automatically enroll contacts in sequences based on triggers
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Auto-enroll on gift received
 */
export const autoEnrollOnGift = inngest.createFunction(
  {
    id: 'auto-enroll-on-gift',
    name: 'Auto-Enroll Contact on Gift',
  },
  { event: 'gift/created' },
  async ({ event, step }) => {
    const { giftId, contactId, organizationId, amount, isFirstGift } = event.data

    // Find active sequences triggered by gifts
    const sequences = await step.run('find-gift-sequences', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_sequences')
        .select('id, trigger_config')
        .eq('organization_id', organizationId)
        .eq('trigger_type', 'gift')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching gift sequences:', error)
        return []
      }

      // Filter by trigger config
      return (data || []).filter((seq) => {
        const config = seq.trigger_config || {}

        // Check if sequence is for first gifts only
        if (config.first_gift_only && !isFirstGift) {
          return false
        }

        // Check minimum gift amount
        if (config.gift_amount_min && amount < config.gift_amount_min) {
          return false
        }

        // Check maximum gift amount
        if (config.gift_amount_max && amount > config.gift_amount_max) {
          return false
        }

        return true
      })
    })

    if (sequences.length === 0) {
      return { message: 'No matching sequences found', count: 0 }
    }

    // Enroll contact in matching sequences
    const enrollments = await step.run('enroll-in-sequences', async () => {
      const supabase = createAdminClient()
      const results = []

      for (const sequence of sequences) {
        try {
          // Get first step timing
          const { data: firstStep } = await supabase
            .from('email_sequence_steps')
            .select('delay_days, delay_hours')
            .eq('sequence_id', sequence.id)
            .eq('step_order', 1)
            .single()

          if (!firstStep) {
            console.warn(`Sequence ${sequence.id} has no steps`)
            continue
          }

          // Calculate next step time
          const now = new Date()
          const nextStepAt = new Date(
            now.getTime() +
              (firstStep.delay_days || 0) * 24 * 60 * 60 * 1000 +
              (firstStep.delay_hours || 0) * 60 * 60 * 1000
          )

          // Create enrollment
          const { data, error } = await supabase
            .from('sequence_enrollments')
            .insert({
              organization_id: organizationId,
              sequence_id: sequence.id,
              contact_id: contactId,
              trigger_event_id: giftId,
              trigger_event_type: 'gift',
              current_step: 0,
              status: 'active',
              next_step_at: nextStepAt.toISOString(),
            })
            .select('id')
            .single()

          if (error) {
            if (error.code === '23505') {
              // Already enrolled, skip
              continue
            }
            console.error('Error enrolling contact:', error)
            continue
          }

          results.push({
            sequenceId: sequence.id,
            enrollmentId: data.id,
          })
        } catch (error) {
          console.error(`Error enrolling in sequence ${sequence.id}:`, error)
        }
      }

      return results
    })

    return {
      message: `Enrolled contact in ${enrollments.length} sequences`,
      count: enrollments.length,
      enrollments,
    }
  }
)

/**
 * Auto-enroll on volunteer signup
 */
export const autoEnrollOnVolunteerSignup = inngest.createFunction(
  {
    id: 'auto-enroll-on-volunteer-signup',
    name: 'Auto-Enroll Contact on Volunteer Signup',
  },
  { event: 'volunteer/signup' },
  async ({ event, step }) => {
    const { contactId, shiftId, organizationId, isFirstShift } = event.data

    // Find active sequences triggered by volunteer signups
    const sequences = await step.run('find-volunteer-sequences', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_sequences')
        .select('id, trigger_config')
        .eq('organization_id', organizationId)
        .eq('trigger_type', 'volunteer_signup')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching volunteer sequences:', error)
        return []
      }

      // Filter by trigger config
      return (data || []).filter((seq) => {
        const config = seq.trigger_config || {}

        // Check if sequence is for first shifts only
        if (config.first_shift_only && !isFirstShift) {
          return false
        }

        return true
      })
    })

    if (sequences.length === 0) {
      return { message: 'No matching sequences found', count: 0 }
    }

    // Enroll contact in matching sequences
    const enrollments = await step.run('enroll-in-sequences', async () => {
      const supabase = createAdminClient()
      const results = []

      for (const sequence of sequences) {
        try {
          // Get first step timing
          const { data: firstStep } = await supabase
            .from('email_sequence_steps')
            .select('delay_days, delay_hours')
            .eq('sequence_id', sequence.id)
            .eq('step_order', 1)
            .single()

          if (!firstStep) {
            console.warn(`Sequence ${sequence.id} has no steps`)
            continue
          }

          // Calculate next step time
          const now = new Date()
          const nextStepAt = new Date(
            now.getTime() +
              (firstStep.delay_days || 0) * 24 * 60 * 60 * 1000 +
              (firstStep.delay_hours || 0) * 60 * 60 * 1000
          )

          // Create enrollment
          const { data, error } = await supabase
            .from('sequence_enrollments')
            .insert({
              organization_id: organizationId,
              sequence_id: sequence.id,
              contact_id: contactId,
              trigger_event_id: shiftId,
              trigger_event_type: 'volunteer_signup',
              current_step: 0,
              status: 'active',
              next_step_at: nextStepAt.toISOString(),
            })
            .select('id')
            .single()

          if (error) {
            if (error.code === '23505') {
              // Already enrolled, skip
              continue
            }
            console.error('Error enrolling contact:', error)
            continue
          }

          results.push({
            sequenceId: sequence.id,
            enrollmentId: data.id,
          })
        } catch (error) {
          console.error(`Error enrolling in sequence ${sequence.id}:`, error)
        }
      }

      return results
    })

    return {
      message: `Enrolled contact in ${enrollments.length} sequences`,
      count: enrollments.length,
      enrollments,
    }
  }
)

/**
 * Auto-enroll on lapse risk detected
 */
export const autoEnrollOnLapseRisk = inngest.createFunction(
  {
    id: 'auto-enroll-on-lapse-risk',
    name: 'Auto-Enroll Contact on Lapse Risk',
  },
  { event: 'donor/lapse-risk-detected' },
  async ({ event, step }) => {
    const { contactId, organizationId, riskLevel } = event.data

    // Find active sequences triggered by lapse risk
    const sequences = await step.run('find-lapse-sequences', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('email_sequences')
        .select('id, trigger_config')
        .eq('organization_id', organizationId)
        .eq('trigger_type', 'lapse_risk')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching lapse sequences:', error)
        return []
      }

      // Filter by risk level
      return (data || []).filter((seq) => {
        const config = seq.trigger_config || {}

        // Check if risk level matches
        if (config.risk_level && config.risk_level !== riskLevel) {
          return false
        }

        return true
      })
    })

    if (sequences.length === 0) {
      return { message: 'No matching sequences found', count: 0 }
    }

    // Enroll contact in matching sequences
    const enrollments = await step.run('enroll-in-sequences', async () => {
      const supabase = createAdminClient()
      const results = []

      for (const sequence of sequences) {
        try {
          // Get first step timing
          const { data: firstStep } = await supabase
            .from('email_sequence_steps')
            .select('delay_days, delay_hours')
            .eq('sequence_id', sequence.id)
            .eq('step_order', 1)
            .single()

          if (!firstStep) {
            console.warn(`Sequence ${sequence.id} has no steps`)
            continue
          }

          // Calculate next step time
          const now = new Date()
          const nextStepAt = new Date(
            now.getTime() +
              (firstStep.delay_days || 0) * 24 * 60 * 60 * 1000 +
              (firstStep.delay_hours || 0) * 60 * 60 * 1000
          )

          // Create enrollment
          const { data, error } = await supabase
            .from('sequence_enrollments')
            .insert({
              organization_id: organizationId,
              sequence_id: sequence.id,
              contact_id: contactId,
              trigger_event_type: 'lapse_risk',
              current_step: 0,
              status: 'active',
              next_step_at: nextStepAt.toISOString(),
            })
            .select('id')
            .single()

          if (error) {
            if (error.code === '23505') {
              // Already enrolled, skip
              continue
            }
            console.error('Error enrolling contact:', error)
            continue
          }

          results.push({
            sequenceId: sequence.id,
            enrollmentId: data.id,
          })
        } catch (error) {
          console.error(`Error enrolling in sequence ${sequence.id}:`, error)
        }
      }

      return results
    })

    return {
      message: `Enrolled contact in ${enrollments.length} sequences`,
      count: enrollments.length,
      enrollments,
    }
  }
)
