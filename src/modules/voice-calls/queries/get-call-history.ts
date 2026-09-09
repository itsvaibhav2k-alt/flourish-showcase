'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import type { VoiceCallRecord } from '../schemas/call.schema';

/**
 * Fetch call history for a specific contact.
 */
export async function getCallHistory(
  contactId: string,
  limit = 20,
): Promise<VoiceCallRecord[]> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching call history:', error);
      return [];
    }

    return (data || []) as VoiceCallRecord[];
  } catch (error) {
    console.error('Error in getCallHistory:', error);
    return [];
  }
}

/**
 * Fetch org-wide call history.
 */
export async function getOrgCallHistory(
  limit = 50,
): Promise<VoiceCallRecord[]> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching org call history:', error);
      return [];
    }

    return (data || []) as VoiceCallRecord[];
  } catch (error) {
    console.error('Error in getOrgCallHistory:', error);
    return [];
  }
}
