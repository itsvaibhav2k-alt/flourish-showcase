/**
 * Retell AI Webhook Handler
 *
 * Handles voice call events from Retell:
 * - call_started: Call has begun (creates record for inbound calls)
 * - call_ended: Call completed with transcript and duration
 * - call_analyzed: Post-call analysis with summary and sentiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Retell from 'retell-sdk';
import { inngest } from '@/lib/inngest/client';

// Use service role client for webhook processing (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for webhook handler');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// Map Retell disconnection reasons to call outcomes
function mapDisconnectionToOutcome(reason: string): string {
  const outcomeMap: Record<string, string> = {
    'agent_hangup': 'completed',
    'user_hangup': 'completed',
    'call_transfer': 'transferred',
    'voicemail_reached': 'voicemail',
    'inactivity': 'no_answer',
    'machine_detected': 'voicemail',
    'max_duration_reached': 'completed',
    'concurrency_limit_reached': 'failed',
    'dial_busy': 'busy',
    'dial_failed': 'failed',
    'dial_no_answer': 'no_answer',
    'error_inbound_webhook': 'failed',
    'error_llm_websocket_open': 'failed',
    'error_llm_websocket_lost_connection': 'failed',
    'error_llm_websocket_runtime': 'failed',
    'error_llm_websocket_corrupt_payload': 'failed',
    'error_frontend_corrupted_payload': 'failed',
    'error_twilio': 'failed',
    'error_no_audio_received': 'failed',
    'error_asr': 'failed',
    'error_retell': 'failed',
    'error_unknown': 'failed',
    'registered_call_timeout': 'failed',
  };

  return outcomeMap[reason] || 'unknown';
}

// Normalize phone number for database lookup (strip +1 prefix, non-digits)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Remove leading 1 if it's a US number with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  return digits;
}

interface RetellWebhookPayload {
  event: string;
  call: {
    call_id: string;
    agent_id: string;
    call_status: string;
    start_timestamp?: number;
    end_timestamp?: number;
    duration_ms?: number;
    from_number?: string;
    to_number?: string;
    direction?: string;
    disconnection_reason?: string;
    transcript?: string;
    transcript_object?: Array<{
      role: string;
      content: string;
      words?: Array<{
        word: string;
        start: number;
        end: number;
      }>;
    }>;
    call_analysis?: {
      call_summary?: string;
      user_sentiment?: string;
      call_successful?: boolean;
      custom_analysis_data?: Record<string, unknown>;
    };
    metadata?: Record<string, string>;
  };
}

/**
 * Find or create a voice_call record for a Retell call.
 * For outbound calls, the record already exists (created by server action).
 * For inbound calls, we create one and try to match the caller to a contact.
 */
async function findOrCreateVoiceCall(
  supabase: ReturnType<typeof getServiceClient>,
  retellCallId: string,
  callData: RetellWebhookPayload['call'],
) {
  // Try to find existing record (outbound calls)
  const { data: existing } = await supabase
    .from('voice_calls')
    .select('id, organization_id, contact_id')
    .eq('retell_call_id', retellCallId)
    .single();

  if (existing) return existing;

  // No existing record — this is likely an inbound call
  // Find the org that owns this phone number
  const toNumber = callData.to_number || '';
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('retell_phone_number', toNumber)
    .single();

  if (!org) {
    // Try normalized match
    const normalizedTo = normalizePhone(toNumber);
    const { data: orgByNormalized } = await supabase
      .from('organizations')
      .select('id, retell_phone_number')
      .not('retell_phone_number', 'is', null);

    const matchedOrg = orgByNormalized?.find(
      (o) => normalizePhone(o.retell_phone_number || '') === normalizedTo,
    );

    if (!matchedOrg) {
      console.warn(`No org found for inbound number: ${toNumber}`);
      return null;
    }

    return await createInboundCallRecord(supabase, matchedOrg.id, callData, retellCallId);
  }

  return await createInboundCallRecord(supabase, org.id, callData, retellCallId);
}

async function createInboundCallRecord(
  supabase: ReturnType<typeof getServiceClient>,
  organizationId: string,
  callData: RetellWebhookPayload['call'],
  retellCallId: string,
) {
  const fromNumber = callData.from_number || '';

  // Try to match caller phone to a contact
  const normalizedFrom = normalizePhone(fromNumber);
  let contactId: string | null = null;

  if (normalizedFrom) {
    // Search for contact by phone (try exact and normalized matches)
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, phone')
      .eq('organization_id', organizationId)
      .not('phone', 'is', null);

    const matched = contacts?.find(
      (c) => normalizePhone(c.phone || '') === normalizedFrom,
    );
    contactId = matched?.id || null;
  }

  // Create the inbound voice_call record
  const { data: newCall, error } = await supabase
    .from('voice_calls')
    .insert({
      organization_id: organizationId,
      contact_id: contactId,
      retell_call_id: retellCallId,
      retell_agent_id: callData.agent_id,
      call_type: 'custom',
      direction: 'inbound',
      status: 'in_progress',
      from_phone: fromNumber,
      to_phone: callData.to_number || null,
      started_at: callData.start_timestamp
        ? new Date(callData.start_timestamp).toISOString()
        : new Date().toISOString(),
    })
    .select('id, organization_id, contact_id')
    .single();

  if (error) {
    console.error('Failed to create inbound call record:', error);
    return null;
  }

  console.log(
    `Inbound call record created: ${newCall.id} (contact: ${contactId || 'unknown'}, from: ${fromNumber})`,
  );

  // Start polling as fallback for inbound calls (same resilience as outbound calls)
  try {
    await inngest.send({
      name: 'voice/call.poll',
      data: {
        callId: newCall.id,
        retellCallId,
        organizationId,
        contactId: contactId || null,
      },
    });
  } catch (pollErr) {
    console.error('Failed to start inbound call polling:', pollErr);
  }

  return newCall;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-retell-signature');
    const retellApiKey = process.env.RETELL_API_KEY?.trim();

    // Verify signature using Retell SDK
    if (retellApiKey && signature) {
      if (!Retell.verify(payload, retellApiKey, signature)) {
        console.error('Invalid Retell webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 },
        );
      }
    }

    const event: RetellWebhookPayload = JSON.parse(payload);
    const supabase = getServiceClient();
    const retellCallId = event.call.call_id;

    // Find or create voice_call record (handles both inbound and outbound)
    const voiceCall = await findOrCreateVoiceCall(supabase, retellCallId, event.call);

    if (!voiceCall) {
      console.warn(`Could not find or create voice_call for: ${retellCallId}`);
      return NextResponse.json({ received: true, matched: false });
    }

    switch (event.event) {
      case 'call_started': {
        await supabase
          .from('voice_calls')
          .update({
            status: 'in_progress',
            started_at: event.call.start_timestamp
              ? new Date(event.call.start_timestamp).toISOString()
              : new Date().toISOString(),
          })
          .eq('id', voiceCall.id);

        console.log(`Voice call started: ${retellCallId} (${event.call.direction || 'unknown'} direction)`);
        break;
      }

      case 'call_ended': {
        const durationSeconds = event.call.duration_ms
          ? Math.round(event.call.duration_ms / 1000)
          : 0;
        const outcome = mapDisconnectionToOutcome(
          event.call.disconnection_reason || 'unknown',
        );

        // Determine final status based on outcome
        const status = ['failed', 'busy'].includes(outcome)
          ? 'failed'
          : outcome === 'no_answer'
            ? 'no_answer'
            : outcome === 'voicemail'
              ? 'voicemail'
              : 'completed';

        await supabase
          .from('voice_calls')
          .update({
            status,
            outcome,
            duration_seconds: durationSeconds,
            ended_at: event.call.end_timestamp
              ? new Date(event.call.end_timestamp).toISOString()
              : new Date().toISOString(),
          })
          .eq('id', voiceCall.id);

        // Log activity (only if we have a contact)
        if (voiceCall.contact_id) {
          await supabase.from('activities').insert({
            organization_id: voiceCall.organization_id,
            contact_id: voiceCall.contact_id,
            activity_type: 'voice_call',
            description: `Voice call ${status} (${durationSeconds}s, outcome: ${outcome})`,
            metadata: {
              callId: voiceCall.id,
              retellCallId,
              durationSeconds,
              outcome,
              direction: event.call.direction || 'unknown',
              disconnectionReason: event.call.disconnection_reason,
            },
          });
        }

        // Emit completion event for downstream processing
        await inngest.send({
          name: 'voice/call.completed',
          data: {
            callId: voiceCall.id,
            retellCallId,
            organizationId: voiceCall.organization_id,
            contactId: voiceCall.contact_id || null,
            durationSeconds,
            outcome,
          },
        });

        console.log(`Voice call ended: ${retellCallId} (${outcome}, ${durationSeconds}s)`);
        break;
      }

      case 'call_analyzed': {
        // Store transcript in call_transcripts
        const transcript = event.call.transcript_object?.map((t) => ({
          role: t.role,
          content: t.content,
          timestamp: t.words?.[0]?.start || null,
        })) || [];

        const analysis = event.call.call_analysis;

        await supabase.from('call_transcripts').insert({
          call_id: voiceCall.id,
          organization_id: voiceCall.organization_id,
          transcript,
          summary: analysis?.call_summary || null,
          sentiment_analysis: analysis?.user_sentiment
            ? { overall: analysis.user_sentiment, successful: analysis.call_successful }
            : null,
        });

        // Update voice call with sentiment
        if (analysis?.user_sentiment) {
          await supabase
            .from('voice_calls')
            .update({ sentiment: analysis.user_sentiment.toLowerCase() })
            .eq('id', voiceCall.id);
        }

        // Emit event for deeper AI transcript analysis (also sends admin email)
        await inngest.send({
          name: 'voice/transcript.process',
          data: {
            callId: voiceCall.id,
            organizationId: voiceCall.organization_id,
            contactId: voiceCall.contact_id || null,
          },
        });

        console.log(`Voice call analyzed: ${retellCallId}`);
        break;
      }

      default: {
        // Ignore events we don't handle
        return NextResponse.json({ received: true, ignored: true });
      }
    }

    return NextResponse.json({
      received: true,
      matched: true,
      event: event.event,
      callId: voiceCall.id,
    });
  } catch (error) {
    console.error('Retell webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'retell-webhook',
    timestamp: new Date().toISOString(),
  });
}
