import { createAdminClient } from '@/lib/supabase/server';
import { buildDonorContext, type DonorContext } from '@/lib/ai/context/builder';

export interface CallContext extends DonorContext {
  previousCalls: Array<{
    callType: string;
    date: string;
    outcome: string | null;
    summary: string | null;
    sentiment: string | null;
  }>;
}

/**
 * Build rich context for a voice call by extending the donor context
 * with previous call summaries and transcripts.
 */
export async function buildCallContext(
  contactId: string,
  _callType: string,
): Promise<CallContext> {
  // Get base donor context
  const donorContext = await buildDonorContext(contactId);

  // Fetch previous calls for this contact
  const supabase = createAdminClient();

  const { data: previousCalls } = await supabase
    .from('voice_calls')
    .select(`
      call_type,
      created_at,
      outcome,
      sentiment,
      call_transcripts (summary)
    `)
    .eq('contact_id', contactId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  const callHistory = (previousCalls || []).map((call) => ({
    callType: call.call_type,
    date: call.created_at,
    outcome: call.outcome,
    summary: Array.isArray(call.call_transcripts) && call.call_transcripts.length > 0
      ? (call.call_transcripts[0] as { summary: string | null }).summary
      : null,
    sentiment: call.sentiment,
  }));

  return {
    ...donorContext,
    previousCalls: callHistory,
  };
}
