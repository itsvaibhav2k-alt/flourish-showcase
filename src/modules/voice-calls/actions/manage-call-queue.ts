'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { inngest } from '@/lib/inngest/client';

interface CallQueueResult {
  success: boolean;
  queueId?: string;
  error?: string;
}

interface CreateCallQueueParams {
  name: string;
  callType: string;
  contactIds: string[];
  stopCondition?: { type: 'count'; value: number } | { type: 'all' };
  maxRetries?: number;
}

/**
 * Create a new call queue with contacts sorted by reliability_score descending.
 */
export async function createCallQueue(
  params: CreateCallQueueParams,
): Promise<CallQueueResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    if (!params.contactIds.length) {
      return { success: false, error: 'At least one contact is required' };
    }

    const supabase = await createClient();

    // Fetch contacts with reliability_score for sorting
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, reliability_score')
      .in('id', params.contactIds)
      .eq('organization_id', organizationId);

    if (contactsError || !contacts?.length) {
      return { success: false, error: 'Failed to fetch contacts' };
    }

    // Sort by reliability_score descending (null scores go last)
    const sorted = contacts.sort(
      (a, b) => (b.reliability_score ?? 0) - (a.reliability_score ?? 0),
    );

    // Create the queue
    const { data: queue, error: queueError } = await supabase
      .from('call_queues')
      .insert({
        organization_id: organizationId,
        name: params.name,
        call_type: params.callType,
        status: 'pending',
        stop_condition: params.stopCondition ?? { type: 'all' },
        max_retries: params.maxRetries ?? 1,
        total_contacts: sorted.length,
      })
      .select('id')
      .single();

    if (queueError || !queue) {
      console.error('Failed to create call queue:', queueError);
      return { success: false, error: 'Failed to create call queue' };
    }

    // Create queue items sorted by reliability_score
    const items = sorted.map((contact, index) => ({
      queue_id: queue.id,
      contact_id: contact.id,
      sort_order: index,
      status: 'pending' as const,
    }));

    const { error: itemsError } = await supabase
      .from('call_queue_items')
      .insert(items);

    if (itemsError) {
      console.error('Failed to create queue items:', itemsError);
      return { success: false, error: 'Failed to create queue items' };
    }

    return { success: true, queueId: queue.id };
  } catch (error) {
    console.error('Error creating call queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create call queue',
    };
  }
}

/**
 * Start processing a call queue by emitting the voice/queue.process event.
 */
export async function startCallQueue(queueId: string): Promise<CallQueueResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    const supabase = await createClient();

    // Verify queue exists and belongs to org
    const { data: queue, error } = await supabase
      .from('call_queues')
      .select('id, status')
      .eq('id', queueId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !queue) {
      return { success: false, error: 'Call queue not found' };
    }

    if (queue.status !== 'pending' && queue.status !== 'paused') {
      return { success: false, error: `Cannot start queue in ${queue.status} state` };
    }

    // Update status to pending (will be set to in_progress by the function)
    await supabase
      .from('call_queues')
      .update({ status: 'pending' })
      .eq('id', queueId);

    // Emit the processing event
    await inngest.send({
      name: 'voice/queue.process',
      data: {
        queueId,
        organizationId,
      },
    });

    return { success: true, queueId };
  } catch (error) {
    console.error('Error starting call queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start call queue',
    };
  }
}

/**
 * Pause a running call queue.
 */
export async function pauseCallQueue(queueId: string): Promise<CallQueueResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('call_queues')
      .update({ status: 'paused' })
      .eq('id', queueId)
      .eq('organization_id', organizationId);

    if (error) {
      return { success: false, error: 'Failed to pause call queue' };
    }

    return { success: true, queueId };
  } catch (error) {
    console.error('Error pausing call queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause call queue',
    };
  }
}

/**
 * Cancel a call queue.
 */
export async function cancelCallQueue(queueId: string): Promise<CallQueueResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('call_queues')
      .update({ status: 'cancelled' })
      .eq('id', queueId)
      .eq('organization_id', organizationId);

    if (error) {
      return { success: false, error: 'Failed to cancel call queue' };
    }

    return { success: true, queueId };
  } catch (error) {
    console.error('Error cancelling call queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel call queue',
    };
  }
}
