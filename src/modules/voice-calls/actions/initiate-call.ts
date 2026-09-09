'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { inngest } from '@/lib/inngest/client';
import { InitiateCallParams } from '../schemas/call.schema';

interface InitiateCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Server action to initiate a voice call with Flora.
 * Validates the contact has a phone number and hasn't opted out,
 * then emits a voice/call.initiate event via Inngest.
 */
export async function initiateCall(
  contactId: string,
  callType: string,
  options?: { scheduledFor?: string },
): Promise<InitiateCallResult> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    // Validate params
    const parsed = InitiateCallParams.safeParse({
      contactId,
      callType,
      scheduledFor: options?.scheduledFor,
    });
    if (!parsed.success) {
      return { success: false, error: 'Invalid call parameters' };
    }

    const supabase = await createClient();

    // Check contact exists and has a phone number
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, phone_call_opt_out')
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

    // Check that voice calls are enabled for the org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('voice_calls_enabled')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return { success: false, error: 'Organization not found' };
    }

    if (!org.voice_calls_enabled) {
      return { success: false, error: 'Voice calls are not enabled for this organization' };
    }

    // Create a pending voice call record
    const { data: callRecord, error: insertError } = await supabase
      .from('voice_calls')
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        call_type: parsed.data.callType,
        direction: 'outbound',
        status: parsed.data.scheduledFor ? 'scheduled' : 'queued',
        to_phone: contact.phone,
      })
      .select('id')
      .single();

    if (insertError || !callRecord) {
      console.error('Failed to create voice call record:', insertError);
      return { success: false, error: 'Failed to create call record' };
    }

    // Emit Inngest event to initiate the call
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
    console.error('Error initiating call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate call',
    };
  }
}
