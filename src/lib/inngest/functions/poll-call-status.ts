/**
 * Poll Call Status
 *
 * Polls Retell API for call completion when webhooks aren't reachable
 * (e.g., local development). Triggered after a call is initiated.
 *
 * Flow:
 * 1. Wait 30 seconds for the call to potentially complete
 * 2. Fetch call status from Retell API
 * 3. If completed, update DB and trigger transcript processing
 * 4. If still in progress, retry (up to 10 attempts, 30s apart = 5 min max)
 */

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { getRetellClient } from '@/lib/retell/client';

export const pollCallStatus = inngest.createFunction(
  {
    id: 'poll-call-status',
    name: 'Poll Call Status from Retell',
    retries: 0,
  },
  { event: 'voice/call.poll' },
  async ({ event, step }) => {
    const { callId, retellCallId, organizationId, contactId } = event.data;

    // Poll up to 10 times (5 minutes total)
    for (let attempt = 0; attempt < 10; attempt++) {
      // Wait 30 seconds between polls
      await step.sleep(`wait-${attempt}`, '30s');

      const result = await step.run(`check-status-${attempt}`, async () => {
        const retell = getRetellClient();

        const retellCall = await retell.call.retrieve(retellCallId);

        return {
          status: retellCall.call_status,
          durationMs: retellCall.duration_ms,
          disconnectionReason: retellCall.disconnection_reason,
          transcript: retellCall.transcript,
          transcriptObject: retellCall.transcript_object,
          callAnalysis: retellCall.call_analysis,
          startTimestamp: retellCall.start_timestamp,
          endTimestamp: retellCall.end_timestamp,
        };
      });

      // If call is still in progress, continue polling
      if (result.status === 'registered' || result.status === 'ongoing') {
        continue;
      }

      // Call has ended - process it
      const durationSeconds = result.durationMs
        ? Math.round(result.durationMs / 1000)
        : 0;

      // Map disconnection reason to outcome
      const outcomeMap: Record<string, string> = {
        agent_hangup: 'completed',
        user_hangup: 'completed',
        call_transfer: 'transferred',
        voicemail_reached: 'voicemail',
        inactivity: 'no_answer',
        machine_detected: 'voicemail',
        max_duration_reached: 'completed',
        dial_busy: 'busy',
        dial_failed: 'failed',
        dial_no_answer: 'no_answer',
      };
      const outcome = outcomeMap[result.disconnectionReason || ''] || 'completed';
      const status = ['failed', 'busy'].includes(outcome)
        ? 'failed'
        : outcome === 'no_answer'
          ? 'no_answer'
          : outcome === 'voicemail'
            ? 'voicemail'
            : 'completed';

      // Update voice_calls record
      await step.run('update-call-record', async () => {
        const supabase = createAdminClient();

        await supabase
          .from('voice_calls')
          .update({
            status,
            outcome,
            duration_seconds: durationSeconds,
            started_at: result.startTimestamp
              ? new Date(result.startTimestamp).toISOString()
              : null,
            ended_at: result.endTimestamp
              ? new Date(result.endTimestamp).toISOString()
              : new Date().toISOString(),
          })
          .eq('id', callId);

        // Log activity (only if we have a matched contact)
        if (contactId) {
          await supabase.from('activities').insert({
            organization_id: organizationId,
            contact_id: contactId,
            activity_type: 'voice_call',
            description: `Voice call ${status} (${durationSeconds}s, outcome: ${outcome})`,
            metadata: {
              callId,
              retellCallId,
              durationSeconds,
              outcome,
              disconnectionReason: result.disconnectionReason,
              source: 'poll',
            },
          });
        }
      });

      // Emit completion event for cost tracking
      await step.run('emit-completion', async () => {
        await inngest.send({
          name: 'voice/call.completed',
          data: {
            callId,
            retellCallId,
            organizationId,
            contactId,
            durationSeconds,
            outcome,
          },
        });
      });

      // Store transcript if available
      if (result.transcriptObject && result.transcriptObject.length > 0) {
        await step.run('store-transcript', async () => {
          const supabase = createAdminClient();

          const transcript = result.transcriptObject!.map((t: { role: string; content: string; words?: Array<{ start: number }> }) => ({
            role: t.role,
            content: t.content,
            timestamp: t.words?.[0]?.start || null,
          }));

          const analysis = result.callAnalysis as {
            call_summary?: string;
            user_sentiment?: string;
            call_successful?: boolean;
            custom_analysis_data?: Record<string, unknown>;
          } | undefined;

          await supabase.from('call_transcripts').insert({
            call_id: callId,
            organization_id: organizationId,
            transcript,
            summary: analysis?.call_summary || analysis?.custom_analysis_data?.call_summary as string || null,
            sentiment_analysis: analysis?.user_sentiment
              ? { overall: analysis.user_sentiment, successful: analysis.call_successful }
              : analysis?.custom_analysis_data
                ? { custom: analysis.custom_analysis_data }
                : null,
          });

          // Update sentiment on voice_calls (lowercase to match DB constraint)
          const rawSentiment = analysis?.user_sentiment
            || analysis?.custom_analysis_data?.user_sentiment as string
            || null;
          if (rawSentiment) {
            await supabase
              .from('voice_calls')
              .update({ sentiment: rawSentiment.toLowerCase() })
              .eq('id', callId);
          }
        });

        // Trigger deep transcript analysis (which also emails admins)
        await step.run('trigger-transcript-analysis', async () => {
          await inngest.send({
            name: 'voice/transcript.process',
            data: { callId, organizationId, contactId },
          });
        });
      }

      return {
        completed: true,
        attempt,
        status,
        outcome,
        durationSeconds,
        hasTranscript: (result.transcriptObject?.length || 0) > 0,
      };
    }

    // Timed out after 5 minutes of polling
    return {
      completed: false,
      reason: 'Polling timed out after 5 minutes',
    };
  },
);
