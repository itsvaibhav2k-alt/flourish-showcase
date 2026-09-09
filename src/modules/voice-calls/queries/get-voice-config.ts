'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrganizationId } from '@/lib/auth/organization';

export interface ProgramEntry {
  name: string;
  description: string;
}

export interface CallTypeOverride {
  additionalNotes: string;
  customScript: string | null;
}

export interface VoiceCallConfig {
  orgKnowledge: {
    mission: string;
    description: string;
    programs: ProgramEntry[];
    impactFacts: string[];
    topicsToAvoid: string[];
  };
  callBehavior: {
    greeting: string;
    infoToCollect: string[];
    customQuestions: string[];
    closingGuidance: string;
  };
  callTypeOverrides: Record<string, CallTypeOverride>;
}

const DEFAULT_CONFIG: VoiceCallConfig = {
  orgKnowledge: {
    mission: '',
    description: '',
    programs: [],
    impactFacts: [],
    topicsToAvoid: [],
  },
  callBehavior: {
    greeting: '',
    infoToCollect: [],
    customQuestions: [],
    closingGuidance: '',
  },
  callTypeOverrides: {},
};

/**
 * Get voice call configuration for the current organization.
 * Returns typed config with defaults for missing fields.
 */
export async function getVoiceCallConfig(): Promise<VoiceCallConfig> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) {
      return DEFAULT_CONFIG;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('voice_call_config')
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      // Column may not exist yet if migration hasn't been applied — return defaults silently
      return DEFAULT_CONFIG;
    }

    const raw = (data.voice_call_config as Record<string, unknown>) || {};

    return {
      orgKnowledge: {
        mission: (raw.orgKnowledge as Record<string, unknown>)?.mission as string || '',
        description: (raw.orgKnowledge as Record<string, unknown>)?.description as string || '',
        programs: Array.isArray((raw.orgKnowledge as Record<string, unknown>)?.programs)
          ? ((raw.orgKnowledge as Record<string, unknown>).programs as ProgramEntry[])
          : [],
        impactFacts: Array.isArray((raw.orgKnowledge as Record<string, unknown>)?.impactFacts)
          ? ((raw.orgKnowledge as Record<string, unknown>).impactFacts as string[])
          : [],
        topicsToAvoid: Array.isArray((raw.orgKnowledge as Record<string, unknown>)?.topicsToAvoid)
          ? ((raw.orgKnowledge as Record<string, unknown>).topicsToAvoid as string[])
          : [],
      },
      callBehavior: {
        greeting: (raw.callBehavior as Record<string, unknown>)?.greeting as string || '',
        infoToCollect: Array.isArray((raw.callBehavior as Record<string, unknown>)?.infoToCollect)
          ? ((raw.callBehavior as Record<string, unknown>).infoToCollect as string[])
          : [],
        customQuestions: Array.isArray((raw.callBehavior as Record<string, unknown>)?.customQuestions)
          ? ((raw.callBehavior as Record<string, unknown>).customQuestions as string[])
          : [],
        closingGuidance: (raw.callBehavior as Record<string, unknown>)?.closingGuidance as string || '',
      },
      callTypeOverrides: (raw.callTypeOverrides as Record<string, CallTypeOverride>) || {},
    };
  } catch {
    // Return defaults if anything goes wrong (e.g., column not yet migrated)
    return DEFAULT_CONFIG;
  }
}
