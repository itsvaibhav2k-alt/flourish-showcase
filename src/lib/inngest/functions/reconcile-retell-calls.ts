/**
 * Reconcile Retell Calls
 *
 * Safety net cron job that catches inbound calls missed by webhooks.
 * Runs every 10 minutes, checks Retell for recent ended calls,
 * and processes any that are missing from the database.
 *
 * This ensures transcripts are always generated even when:
 * - Retell webhook delivery fails or is delayed
 * - Signature verification rejects legitimate webhooks
 * - Network issues prevent webhook receipt
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { getRetellClient } from '@/lib/retell/client';

// Normalize phone number for database lookup
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  return digits;
}

export const reconcileRetellCalls = inngest.createFunction(
  {
    id: 'reconcile-retell-calls',
    name: 'Reconcile Retell Calls',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const result = await step.run('check-missed-calls', async () => {
      const retell = getRetellClient();
      const supabase = createAdminClient();

      // Fetch recent calls from Retell (last 20 minutes to overlap with cron interval)
      const retellCalls = await retell.call.list({
        limit: 50,
        sort_order: 'descending',
      });

      if (!retellCalls || retellCalls.length === 0) {
        return { checked: 0, created: 0 };
      }

      // Filter to ended inbound calls only
      const endedInbound = retellCalls.filter(
        (c) => c.call_status === 'ended' && c.direction === 'inbound',
      );

      if (endedInbound.length === 0) {
        return { checked: retellCalls.length, created: 0 };
      }

      // Get retell_call_ids already in our database
      const retellCallIds = endedInbound.map((c) => c.call_id);
      const { data: existingCalls } = await supabase
        .from('voice_calls')
        .select('retell_call_id')
        .in('retell_call_id', retellCallIds);

      const existingIds = new Set((existingCalls || []).map((c) => c.retell_call_id));
      const missingCalls = endedInbound.filter((c) => !existingIds.has(c.call_id));

      if (missingCalls.length === 0) {
        return { checked: endedInbound.length, created: 0 };
      }

      console.log(`[Reconcile] Found ${missingCalls.length} missed inbound call(s)`);

      let created = 0;
      for (const call of missingCalls) {
        try {
          const toNumber = call.to_number || '';

          // Find org by phone number
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id, retell_phone_number')
            .not('retell_phone_number', 'is', null);

          const normalizedTo = normalizePhone(toNumber);
          const matchedOrg = orgs?.find(
            (o) => o.retell_phone_number === toNumber
              || normalizePhone(o.retell_phone_number || '') === normalizedTo,
          );

          if (!matchedOrg) {
            console.warn(`[Reconcile] No org for number: ${toNumber} (call: ${call.call_id})`);
            continue;
          }

          // Try to match caller to a contact
          const fromNumber = call.from_number || '';
          const normalizedFrom = normalizePhone(fromNumber);
          let contactId: string | null = null;

          if (normalizedFrom) {
            const { data: contacts } = await supabase
              .from('contacts')
              .select('id, phone')
              .eq('organization_id', matchedOrg.id)
              .not('phone', 'is', null);

            const matched = contacts?.find(
              (c) => normalizePhone(c.phone || '') === normalizedFrom,
            );
            contactId = matched?.id || null;
          }

          // Create the voice_call record
          const durationSeconds = call.duration_ms
            ? Math.round(call.duration_ms / 1000)
            : 0;

          const { data: newCall, error: insertError } = await supabase
            .from('voice_calls')
            .insert({
              organization_id: matchedOrg.id,
              contact_id: contactId,
              retell_call_id: call.call_id,
              retell_agent_id: call.agent_id,
              call_type: 'custom',
              direction: 'inbound',
              status: 'completed',
              outcome: 'completed',
              from_phone: fromNumber,
              to_phone: toNumber,
              duration_seconds: durationSeconds,
              started_at: call.start_timestamp
                ? new Date(call.start_timestamp).toISOString()
                : new Date().toISOString(),
              ended_at: call.end_timestamp
                ? new Date(call.end_timestamp).toISOString()
                : new Date().toISOString(),
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`[Reconcile] Failed to create call ${call.call_id}:`, insertError);
            continue;
          }

          // Store transcript if available
          if (call.transcript_object && call.transcript_object.length > 0) {
            const transcript = call.transcript_object.map((t) => ({
              role: t.role,
              content: t.content,
              timestamp: t.words?.[0]?.start || null,
            }));

            const analysis = call.call_analysis as {
              call_summary?: string;
              user_sentiment?: string;
              call_successful?: boolean;
            } | undefined;

            await supabase.from('call_transcripts').insert({
              call_id: newCall.id,
              organization_id: matchedOrg.id,
              transcript,
              summary: analysis?.call_summary || null,
              sentiment_analysis: analysis?.user_sentiment
                ? { overall: analysis.user_sentiment, successful: analysis.call_successful }
                : null,
            });

            if (analysis?.user_sentiment) {
              await supabase
                .from('voice_calls')
                .update({ sentiment: analysis.user_sentiment.toLowerCase() })
                .eq('id', newCall.id);
            }

            // Trigger deep AI analysis and admin email
            await inngest.send({
              name: 'voice/transcript.process',
              data: {
                callId: newCall.id,
                organizationId: matchedOrg.id,
                contactId,
              },
            });
          }

          console.log(
            `[Reconcile] Created call ${newCall.id} from Retell ${call.call_id} ` +
            `(contact: ${contactId || 'unknown'}, from: ${fromNumber})`,
          );
          created++;
        } catch (err) {
          console.error(`[Reconcile] Error processing ${call.call_id}:`, err);
        }
      }

      return { checked: endedInbound.length, created };
    });

    return result;
  },
);
