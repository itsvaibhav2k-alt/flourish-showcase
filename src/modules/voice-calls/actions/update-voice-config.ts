'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';
import { syncAgentVoiceConfig } from '@/lib/retell/agent-config';
import type { Json } from '@/lib/supabase/types';
import type { VoiceCallConfig } from '../queries/get-voice-config';

/**
 * Update voice call configuration for the current organization.
 */
export async function updateVoiceCallConfig(
  config: VoiceCallConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return { success: false, error: 'No organization selected' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('organizations')
      .update({ voice_call_config: config as unknown as Json })
      .eq('id', organizationId);

    if (error) {
      console.error('Error updating voice call config:', error);
      return { success: false, error: error.message };
    }

    // Sync to Retell agent so changes take effect immediately
    try {
      const adminClient = createAdminClient();
      const { data: org } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      if (org) {
        await syncAgentVoiceConfig(organizationId, config, org.name);
      }
    } catch (syncError) {
      // Don't fail the save if Retell sync fails - config is saved in DB
      console.error('Failed to sync voice config to Retell:', syncError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateVoiceCallConfig:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
