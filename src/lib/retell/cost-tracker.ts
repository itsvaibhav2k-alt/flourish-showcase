/**
 * Voice Call Cost Tracker
 *
 * Tracks Retell telephony costs and reuses trackUsage() from
 * src/lib/ai/cost-tracker.ts for Claude LLM token costs.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { trackUsage } from '@/lib/ai/cost-tracker';

// Retell telephony cost per minute (approximate)
const RETELL_COST_PER_MINUTE = 0.07; // ~$0.06-0.08/min

/**
 * Track the telephony cost of a voice call
 */
export async function trackVoiceCallCost(params: {
  callId: string;
  durationSeconds: number;
}): Promise<number> {
  const { callId, durationSeconds } = params;
  const durationMinutes = durationSeconds / 60;
  const telephonyCost = durationMinutes * RETELL_COST_PER_MINUTE;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('voice_calls')
    .update({ estimated_cost: telephonyCost })
    .eq('id', callId);

  if (error) {
    console.error('Failed to track voice call cost:', error);
  }

  return telephonyCost;
}

/**
 * Track Claude LLM token usage during a voice call turn.
 * Reuses the existing AI cost tracker with emailType='voice_call'.
 */
export async function trackVoiceCallLlmUsage(params: {
  organizationId: string;
  contactId: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  model: string;
}): Promise<void> {
  await trackUsage({
    organizationId: params.organizationId,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cacheCreationInputTokens: params.cacheCreationInputTokens,
    cacheReadInputTokens: params.cacheReadInputTokens,
    model: params.model,
    emailType: 'voice_call',
    contactId: params.contactId,
  });
}

/**
 * Get monthly voice call spend for an organization
 */
export async function getMonthlyVoiceSpend(
  organizationId: string,
): Promise<{ totalCost: number; callCount: number }> {
  const supabase = createAdminClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('voice_calls')
    .select('estimated_cost')
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['completed', 'in_progress', 'voicemail']);

  if (error) {
    console.error('Failed to fetch monthly voice spend:', error);
    return { totalCost: 0, callCount: 0 };
  }

  const totalCost = (data || []).reduce(
    (sum, row) => sum + (row.estimated_cost || 0),
    0,
  );

  return { totalCost, callCount: data?.length ?? 0 };
}
