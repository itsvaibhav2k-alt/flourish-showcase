'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import type { CallTranscriptRecord } from '../schemas/call.schema';

/**
 * Fetch the transcript for a specific voice call.
 */
export async function getCallTranscript(
  callId: string,
): Promise<CallTranscriptRecord | null> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) return null;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('call_id', callId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - transcript not yet available
        return null;
      }
      console.error('Error fetching call transcript:', error);
      return null;
    }

    return data as CallTranscriptRecord;
  } catch (error) {
    console.error('Error in getCallTranscript:', error);
    return null;
  }
}
