'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { inngest } from '@/lib/inngest/client';
import { ScheduleCallParams } from '../schemas/call.schema';

interface ScheduleCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Server action to schedule a future voice call with Flora.
 * Creates a scheduled voice call record and emits an Inngest event
 * that will be delayed until the scheduled time.
 */
export async function scheduleCall(
  contactId: string,
  callType: string,
  scheduledFor: string,
  notes?: string,
): Promise<ScheduleCallResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    // Validate params
    const parsed = ScheduleCallParams.safeParse({
      contactId,
      callType,
      scheduledFor,
      notes,
    });
    if (!parsed.success) {
      return { success: false, error: 'Invalid schedule parameters' };
    }

    // Ensure scheduled time is in the future
    if (new Date(scheduledFor) <= new Date()) {
      return { success: false, error: 'Scheduled time must be in the future' };
    }

    const supabase = await createClient();

    // Check contact exists and has a phone number
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, phone, phone_call_opt_out')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' };
    }

    if (!contact.phone) {
      return { success: false, error: 'Contact does not have a phone number' };
    }

    if (contact.phone_call_opt_out) {
      return { success: false, error: 'Contact has opted out of phone calls' };
    }

    // Create a scheduled voice call record
    const { data: callRecord, error: insertError } = await supabase
      .from('voice_calls')
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        call_type: parsed.data.callType,
        direction: 'outbound',
        status: 'scheduled',
        to_phone: contact.phone,
        follow_up_notes: parsed.data.notes || null,
      })
      .select('id')
      .single();

    if (insertError || !callRecord) {
      console.error('Failed to create scheduled call record:', insertError);
      return { success: false, error: 'Failed to schedule call' };
    }

    // Emit Inngest event with scheduled time
    await inngest.send({
      name: 'voice/call.initiate',
      data: {
        contactId,
        organizationId,
        callType: parsed.data.callType,
        scheduledFor: parsed.data.scheduledFor,
      },
    });

    return { success: true, callId: callRecord.id };
  } catch (error) {
    console.error('Error scheduling call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule call',
    };
  }
}
