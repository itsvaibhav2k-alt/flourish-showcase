/**
 * Process Call Queue
 *
 * Sequentially processes a call queue by dialing each contact in order.
 * Handles pacing, stop conditions, and progress tracking.
 *
 * Triggered by: voice/queue.process
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';

export const processCallQueue = inngest.createFunction(
  {
    id: 'process-call-queue',
    name: 'Process Call Queue',
    retries: 2,
  },
  { event: 'voice/queue.process' },
  async ({ event, step }) => {
    const { queueId, organizationId } = event.data;

    // Step 1: Fetch and validate the queue
    const queue = await step.run('fetch-queue', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('call_queues')
        .select('*')
        .eq('id', queueId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        throw new Error(`Failed to fetch call queue: ${error?.message}`);
      }

      if (data.status !== 'pending' && data.status !== 'in_progress') {
        throw new Error(`Queue is not in a processable state: ${data.status}`);
      }

      return data;
    });

    // Step 2: Mark queue as in_progress
    await step.run('mark-queue-in-progress', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('call_queues')
        .update({ status: 'in_progress' })
        .eq('id', queueId);
    });

    // Step 3: Fetch all pending queue items
    const items = await step.run('fetch-queue-items', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('call_queue_items')
        .select('*')
        .eq('queue_id', queueId)
        .eq('status', 'pending')
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch queue items: ${error.message}`);
      }

      return data || [];
    });

    // Step 4: Process each item sequentially
    let callsCompleted = queue.calls_completed ?? 0;
    let callsConnected = queue.calls_connected ?? 0;
    let currentIndex = queue.current_index ?? 0;

    for (const item of items) {
      // Re-check queue status before each call (may have been paused/cancelled)
      const queueStatus = await step.run(`check-queue-status-${item.id}`, async () => {
        const supabase = createAdminClient();

        const { data } = await supabase
          .from('call_queues')
          .select('status')
          .eq('id', queueId)
          .single();

        return data?.status;
      });

      if (queueStatus === 'paused' || queueStatus === 'cancelled') {
        return {
          queueId,
          status: queueStatus,
          callsCompleted,
          callsConnected,
          reason: `Queue was ${queueStatus}`,
        };
      }

      // Mark item as in_progress
      await step.run(`mark-item-in-progress-${item.id}`, async () => {
        const supabase = createAdminClient();

        await supabase
          .from('call_queue_items')
          .update({ status: 'in_progress' })
          .eq('id', item.id);
      });

      // Emit call initiate event
      await step.run(`initiate-call-${item.id}`, async () => {
        await inngest.send({
          name: 'voice/call.initiate',
          data: {
            contactId: item.contact_id,
            organizationId,
            callType: queue.call_type as any,
            triggerEvent: 'call_queue',
            triggerEventId: queueId,
          },
        });
      });

      // Wait for call completion
      const callResult = await step.waitForEvent(`wait-for-call-${item.id}`, {
        event: 'voice/call.completed',
        match: 'data.contactId',
        timeout: '10m',
      });

      // Update item with result
      await step.run(`update-item-result-${item.id}`, async () => {
        const supabase = createAdminClient();

        const outcome = callResult?.data?.outcome ?? 'no_answer';
        const voiceCallId = callResult?.data?.callId ?? null;

        await supabase
          .from('call_queue_items')
          .update({
            status: 'completed',
            attempts: (item.attempts ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
            last_outcome: outcome,
            voice_call_id: voiceCallId,
          })
          .eq('id', item.id);
      });

      // Update queue progress
      callsCompleted += 1;
      const outcome = callResult?.data?.outcome;
      if (outcome === 'connected' || outcome === 'completed_positive' || outcome === 'completed_neutral' || outcome === 'completed_negative') {
        callsConnected += 1;
      }
      currentIndex += 1;

      await step.run(`update-queue-progress-${item.id}`, async () => {
        const supabase = createAdminClient();

        await supabase
          .from('call_queues')
          .update({
            calls_completed: callsCompleted,
            calls_connected: callsConnected,
            current_index: currentIndex,
          })
          .eq('id', queueId);
      });

      // Check stop condition
      const stopCondition = (queue.stop_condition ?? {}) as { type?: string; value?: number };
      if (stopCondition.type === 'count' && callsConnected >= (stopCondition.value ?? 0)) {
        await step.run('mark-queue-completed-stop-condition', async () => {
          const supabase = createAdminClient();

          await supabase
            .from('call_queues')
            .update({ status: 'completed' })
            .eq('id', queueId);
        });

        return {
          queueId,
          status: 'completed',
          callsCompleted,
          callsConnected,
          reason: `Stop condition met: ${callsConnected} connections`,
        };
      }

      // Pace between calls (30 seconds)
      await step.sleep(`pace-between-calls-${item.id}`, '30s');
    }

    // All items processed — mark queue completed
    await step.run('mark-queue-completed', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('call_queues')
        .update({ status: 'completed' })
        .eq('id', queueId);
    });

    return {
      queueId,
      status: 'completed',
      callsCompleted,
      callsConnected,
      reason: 'All items processed',
    };
  },
);
