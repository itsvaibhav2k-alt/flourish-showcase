/**
 * Handle Voice Call Completed
 *
 * Triggered when a voice call ends (via webhook or polling).
 * Handles post-call cost tracking so the monthly budget guard works.
 * Also handles retry logic for calls that are part of a call queue.
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { trackVoiceCallCost } from '@/lib/retell/cost-tracker';

const RETRYABLE_OUTCOMES = ['no_answer', 'busy', 'voicemail', 'voicemail_left'];

export const handleCallCompleted = inngest.createFunction(
  {
    id: 'handle-call-completed',
    name: 'Handle Call Completed',
    retries: 3,
  },
  { event: 'voice/call.completed' },
  async ({ event, step }) => {
    const { callId, contactId, organizationId, durationSeconds, outcome } = event.data;

    // Track telephony cost so budget enforcement works
    const estimatedCost = await step.run('track-cost', async () => {
      return await trackVoiceCallCost({
        callId,
        durationSeconds,
      });
    });

    // Check if this call is part of a call queue and handle retries
    const retryScheduled = await step.run('check-queue-retry', async () => {
      const supabase = createAdminClient();

      // Find a queue item that references this voice call
      const { data: item } = await supabase
        .from('call_queue_items')
        .select('id, queue_id, attempts, contact_id')
        .eq('voice_call_id', callId)
        .single();

      if (!item) return false;

      // Only retry for retryable outcomes
      if (!RETRYABLE_OUTCOMES.includes(outcome)) return false;

      // Check the queue's max_retries setting
      const { data: queue } = await supabase
        .from('call_queues')
        .select('max_retries, retry_delay_hours, call_type, organization_id, status')
        .eq('id', item.queue_id)
        .single();

      if (!queue) return false;
      if (queue.status === 'cancelled' || queue.status === 'completed') return false;
      if ((item.attempts ?? 0) >= (queue.max_retries ?? 1)) return false;

      // Update item attempts and reset status for retry
      await supabase
        .from('call_queue_items')
        .update({
          attempts: (item.attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
          last_outcome: outcome,
          status: 'pending',
          voice_call_id: null,
        })
        .eq('id', item.id);

      return {
        shouldRetry: true,
        contactId: item.contact_id,
        organizationId: queue.organization_id,
        callType: queue.call_type,
        retryDelayHours: queue.retry_delay_hours ?? 24,
        queueId: item.queue_id,
      };
    });

    // If retry is needed, schedule it after the delay
    if (retryScheduled && typeof retryScheduled === 'object' && retryScheduled.shouldRetry) {
      await step.sleep('retry-delay', `${retryScheduled.retryDelayHours}h`);

      await step.run('schedule-retry-call', async () => {
        await inngest.send({
          name: 'voice/call.initiate',
          data: {
            contactId: retryScheduled.contactId,
            organizationId: retryScheduled.organizationId,
            callType: retryScheduled.callType as any,
            triggerEvent: 'call_queue_retry',
            triggerEventId: retryScheduled.queueId,
          },
        });
      });
    }

    return {
      callId,
      outcome,
      durationSeconds,
      estimatedCost,
      retryScheduled: !!retryScheduled && typeof retryScheduled === 'object',
    };
  },
);
