/**
 * Process Sequence Steps
 *
 * Cron job that runs every 5 minutes to process due sequence steps
 * and generate AI emails for enrolled contacts
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/server'
import { generateDraft } from '@/modules/communications/actions/generate-draft'
import type { EmailType } from '@/modules/communications/actions/generate-draft'

export const processSequenceSteps = inngest.createFunction(
  {
    id: 'process-sequence-steps',
    name: 'Process Sequence Steps',
  },
  { cron: '0 */4 * * *' }, // Every 4 hours
  async ({ step }) => {
    // Step 1: Find enrollments ready for next step
    const dueEnrollments = await step.run('find-due-enrollments', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('sequence_enrollments')
        .select(
          `
          id,
          sequence_id,
          contact_id,
          current_step,
          organization_id,
          trigger_event_id,
          trigger_event_type,
          sequence:email_sequences(
            id,
            name,
            is_active
          )
        `
        )
        .eq('status', 'active')
        .lte('next_step_at', new Date().toISOString())
        .limit(50) // Process max 50 at a time

      if (error) {
        console.error('Error fetching due enrollments:', error)
        return []
      }

      // Filter out inactive sequences
      return (data || []).filter((e: any) => e.sequence?.is_active)
    })

    if (dueEnrollments.length === 0) {
      return { message: 'No due enrollments to process', count: 0 }
    }

    // Step 2: Process each enrollment
    const results = await step.run('process-enrollments', async () => {
      const supabase = createAdminClient()
      const processResults = []

      for (const enrollment of dueEnrollments) {
        try {
          const nextStepOrder = enrollment.current_step + 1

          // Get the next step
          const { data: nextStep, error: stepError } = await supabase
            .from('email_sequence_steps')
            .select('*')
            .eq('sequence_id', enrollment.sequence_id)
            .eq('step_order', nextStepOrder)
            .single()

          if (stepError || !nextStep) {
            // No more steps - mark as completed
            await supabase
              .from('sequence_enrollments')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id)

            processResults.push({
              enrollmentId: enrollment.id,
              status: 'completed',
              message: 'Sequence completed',
            })
            continue
          }

          // Check step conditions
          const shouldSkip = await evaluateStepConditions(
            nextStep.conditions,
            enrollment.contact_id
          )

          if (shouldSkip) {
            // Create skipped execution record
            await supabase.from('sequence_step_executions').insert({
              enrollment_id: enrollment.id,
              step_id: nextStep.id,
              status: 'skipped',
              skip_reason: 'Conditions not met',
              scheduled_at: new Date().toISOString(),
              executed_at: new Date().toISOString(),
            })

            // Move to next step
            const followingStep = await supabase
              .from('email_sequence_steps')
              .select('delay_days, delay_hours')
              .eq('sequence_id', enrollment.sequence_id)
              .eq('step_order', nextStepOrder + 1)
              .single()

            if (followingStep.data) {
              const nextStepAt = new Date(
                Date.now() +
                  followingStep.data.delay_days * 24 * 60 * 60 * 1000 +
                  followingStep.data.delay_hours * 60 * 60 * 1000
              )

              await supabase
                .from('sequence_enrollments')
                .update({
                  current_step: nextStepOrder,
                  next_step_at: nextStepAt.toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', enrollment.id)
            } else {
              // No more steps
              await supabase
                .from('sequence_enrollments')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', enrollment.id)
            }

            processResults.push({
              enrollmentId: enrollment.id,
              status: 'skipped',
              stepId: nextStep.id,
            })
            continue
          }

          // Create execution record
          const { data: execution, error: execError } = await supabase
            .from('sequence_step_executions')
            .insert({
              enrollment_id: enrollment.id,
              step_id: nextStep.id,
              status: 'generating',
              scheduled_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (execError || !execution) {
            console.error('Error creating execution:', execError)
            processResults.push({
              enrollmentId: enrollment.id,
              status: 'failed',
              error: 'Failed to create execution record',
            })
            continue
          }

          // Map template type to email type
          const emailType = mapTemplateToEmailType(
            nextStep.template_type,
            enrollment.trigger_event_type
          )

          // Generate email draft using AI
          const draftResult = await generateDraft({
            organizationId: enrollment.organization_id,
            contactId: enrollment.contact_id,
            emailType,
            context: {
              giftId:
                enrollment.trigger_event_type === 'gift'
                  ? enrollment.trigger_event_id
                  : undefined,
              shiftId:
                enrollment.trigger_event_type === 'volunteer_signup'
                  ? enrollment.trigger_event_id
                  : undefined,
            },
          })

          if (!draftResult.success || !draftResult.draftId) {
            // Mark execution as failed
            await supabase
              .from('sequence_step_executions')
              .update({
                status: 'failed',
                error_message: draftResult.error || 'Failed to generate draft',
                executed_at: new Date().toISOString(),
              })
              .eq('id', execution.id)

            processResults.push({
              enrollmentId: enrollment.id,
              status: 'failed',
              error: draftResult.error,
            })
            continue
          }

          // Update execution with draft ID
          await supabase
            .from('sequence_step_executions')
            .update({
              draft_id: draftResult.draftId,
              status: 'generated',
              executed_at: new Date().toISOString(),
            })
            .eq('id', execution.id)

          // Calculate next step time
          const { data: followingStep } = await supabase
            .from('email_sequence_steps')
            .select('delay_days, delay_hours')
            .eq('sequence_id', enrollment.sequence_id)
            .eq('step_order', nextStepOrder + 1)
            .single()

          if (followingStep) {
            const nextStepAt = new Date(
              Date.now() +
                followingStep.delay_days * 24 * 60 * 60 * 1000 +
                followingStep.delay_hours * 60 * 60 * 1000
            )

            await supabase
              .from('sequence_enrollments')
              .update({
                current_step: nextStepOrder,
                next_step_at: nextStepAt.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id)
          } else {
            // This was the last step, mark as completed
            await supabase
              .from('sequence_enrollments')
              .update({
                current_step: nextStepOrder,
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id)
          }

          processResults.push({
            enrollmentId: enrollment.id,
            status: 'generated',
            draftId: draftResult.draftId,
            stepId: nextStep.id,
          })
        } catch (error) {
          console.error(
            `Error processing enrollment ${enrollment.id}:`,
            error
          )
          processResults.push({
            enrollmentId: enrollment.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return processResults
    })

    const successCount = results.filter((r: any) => r.status === 'generated').length
    const failureCount = results.filter((r: any) => r.status === 'failed').length
    const skippedCount = results.filter((r: any) => r.status === 'skipped').length
    const completedCount = results.filter((r: any) => r.status === 'completed').length

    return {
      message: `Processed ${dueEnrollments.length} enrollments`,
      successCount,
      failureCount,
      skippedCount,
      completedCount,
      results,
    }
  }
)

/**
 * Evaluate step conditions to determine if step should be skipped
 */
async function evaluateStepConditions(
  conditions: Record<string, any>,
  contactId: string
): Promise<boolean> {
  if (!conditions || Object.keys(conditions).length === 0) {
    return false // No conditions, don't skip
  }

  // TODO: Implement condition evaluation
  // Examples:
  // - skip_if_replied: Check if contact replied to previous email
  // - skip_if_donated: Check if contact made a gift since enrollment
  // - skip_if_unsubscribed: Check if contact unsubscribed

  return false
}

/**
 * Map sequence template type to email generation type
 */
function mapTemplateToEmailType(
  templateType: string,
  triggerEventType?: string | null
): EmailType {
  // Map based on template type and context
  switch (templateType) {
    case 'thank_you':
      return 'thank_you'
    case 'reengagement':
      return 'reengagement'
    case 'welcome':
      if (triggerEventType === 'volunteer_signup') {
        return 'volunteer_confirmation'
      }
      return 'general_thanks'
    case 'follow_up':
      return 'custom'
    case 'appeal':
      return 'custom'
    default:
      return 'custom'
  }
}
