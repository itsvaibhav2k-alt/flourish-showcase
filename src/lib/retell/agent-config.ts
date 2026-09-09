/**
 * Retell Agent Configuration
 *
 * Creates Retell LLM + Agent pairs using Retell's built-in LLM engine
 * with Claude. Voice profiles are mapped to system prompts and voice settings.
 * Per-call context is injected via retell_llm_dynamic_variables.
 */

import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { VoiceProfile } from '@/lib/ai/prompts/voice-analysis';
import type { VoiceCallConfig } from '@/modules/voice-calls/queries/get-voice-config';
import { getRetellClient } from './client';
import {
  mapVoiceProfileToVoiceId,
  mapVoiceProfileToSpeed,
} from './voice-mapper';

/**
 * Hash a voice profile to detect changes
 */
function hashVoiceProfile(profile: VoiceProfile): string {
  const serialized = JSON.stringify({
    formality: profile.formality,
    warmth: profile.warmth,
    voiceSummary: profile.voiceSummary,
    toneCharacteristics: profile.toneCharacteristics,
    signaturePhrases: profile.signaturePhrases,
    greetingStyle: profile.greetingStyle,
    closingStyle: profile.closingStyle,
  });
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Build the general prompt for the Retell LLM using dynamic variables.
 * Variables like {{org_name}}, {{contact_name}}, {{contact_context}},
 * and {{call_purpose}} are injected per-call via retell_llm_dynamic_variables.
 */
function buildLlmPrompt(voiceProfile: VoiceProfile): string {
  const toneList = voiceProfile.toneCharacteristics?.join(', ') || 'warm, professional';
  const phrases = voiceProfile.signaturePhrases?.map(p => `- "${p}"`).join('\n') || '';

  return `You are Flora, the AI assistant for {{org_name}}. You are currently on a live phone call with {{contact_name}}.

YOUR ORGANIZATION KNOWLEDGE (you know all of this — use it confidently):

About {{org_name}}:
{{org_knowledge}}

Programs & Services (you can describe these in detail when asked):
{{org_programs}}

Key Impact Facts (cite these specific numbers when relevant — they are accurate and up to date):
{{impact_facts}}

ABOUT THIS CONTACT:
{{contact_context}}

YOUR COMMUNICATION STYLE:
${voiceProfile.voiceSummary || 'A warm, professional nonprofit voice.'}

Key Characteristics:
- Formality: ${(voiceProfile.formality || 'moderate').toUpperCase()}
- Warmth Level: ${voiceProfile.warmth || 7}/10
- Tone: ${toneList}
- Greetings: ${voiceProfile.greetingStyle || 'Warm and personal'}
- Closings: ${voiceProfile.closingStyle || 'Grateful and forward-looking'}
${phrases ? `\nSignature Phrases to Incorporate:\n${phrases}` : ''}

INFORMATION TO COLLECT (when appropriate during the conversation):
{{info_to_collect}}

TOPICS TO AVOID (never bring these up):
{{topics_to_avoid}}

VOICE CALL RULES (CRITICAL):
- Keep responses SHORT (1-3 sentences). This is a phone conversation, not an email.
- Use natural spoken language. No bullet points, headers, markdown, or formatting.
- Never spell out URLs, email addresses, or complex numbers.
- Use conversational fillers naturally (e.g., "Well,", "You know,", "Actually,").
- Listen actively. Acknowledge what the person says before responding.
- If they seem confused, restate simply. If they seem busy, offer to call back.
- Target 3-5 minutes for the call. Wrap up gracefully if it goes longer.
- Be warm and genuine, not scripted or robotic.
- When asked about the organization, programs, or impact, ALWAYS answer using the facts and figures provided above. You know this information — share it confidently and specifically.
- Only say you don't know if the question is truly outside the information provided above. In that case, offer to have someone follow up.
- Never discuss internal systems, AI, or that you are an automated caller.
- Always identify yourself as Flora from {{org_name}} at the start.
- Weave in specific impact facts naturally during conversation to build credibility and excitement.

CLOSING GUIDANCE (follow when wrapping up calls):
{{closing_guidance}}

CALL PURPOSE: {{call_purpose}}`;
}

/**
 * Build dynamic variables from a VoiceCallConfig and org name.
 * Used both when creating a new agent and when syncing config changes.
 */
export function buildDynamicVarsFromConfig(
  config: Partial<VoiceCallConfig>,
  orgName: string,
): Record<string, string> {
  const orgKnowledge = config.orgKnowledge || {
    mission: '',
    description: '',
    programs: [],
    impactFacts: [],
    topicsToAvoid: [],
  };
  const callBehavior = config.callBehavior || {
    greeting: '',
    infoToCollect: [],
    customQuestions: [],
    closingGuidance: '',
  };

  return {
    org_name: orgName,
    contact_name: 'there',
    contact_context: 'No additional context available.',
    call_purpose: 'General check-in call.',
    org_knowledge: [orgKnowledge.mission, orgKnowledge.description]
      .filter(Boolean)
      .join('\n\n') ||
      'A nonprofit organization dedicated to making a positive impact.',
    org_programs: orgKnowledge.programs?.length
      ? orgKnowledge.programs.map(p => `- ${p.name}: ${p.description}`).join('\n')
      : 'Contact the organization for details about current programs.',
    impact_facts: orgKnowledge.impactFacts?.length
      ? orgKnowledge.impactFacts.map(f => `- ${f}`).join('\n')
      : 'No specific impact facts available.',
    info_to_collect: [
      ...(callBehavior.infoToCollect || []),
      ...(callBehavior.customQuestions || []).map(q => `Ask: ${q}`),
    ].join('\n') || 'No specific information to collect.',
    topics_to_avoid: orgKnowledge.topicsToAvoid?.length
      ? orgKnowledge.topicsToAvoid.join('\n- ')
      : 'No specific topics to avoid.',
    closing_guidance: callBehavior.closingGuidance ||
      'Thank them for their time and end on a warm note.',
  };
}

/**
 * Create or update a Retell LLM + Agent for an organization.
 * Uses Retell's built-in LLM engine with Claude for simpler integration.
 */
export async function createOrUpdateAgent(
  orgId: string,
  voiceProfile: VoiceProfile,
  orgName: string,
  voiceCallConfig?: Partial<VoiceCallConfig>,
): Promise<{ retellAgentId: string; created: boolean }> {
  const retell = getRetellClient();
  const supabase = createAdminClient();
  const profileHash = hashVoiceProfile(voiceProfile);

  // Check for existing agent
  const { data: existingAgent } = await supabase
    .from('retell_agents')
    .select('*')
    .eq('organization_id', orgId)
    .eq('agent_type', 'outbound')
    .eq('is_active', true)
    .single();

  const voiceId = mapVoiceProfileToVoiceId(voiceProfile);
  const voiceSpeed = mapVoiceProfileToSpeed(voiceProfile);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/retell`;

  if (existingAgent) {
    // Check if profile has changed
    if (existingAgent.voice_profile_hash === profileHash) {
      return { retellAgentId: existingAgent.retell_agent_id, created: false };
    }

    // Update the existing Retell agent's voice settings
    await retell.agent.update(existingAgent.retell_agent_id, {
      voice_id: voiceId,
      voice_speed: voiceSpeed,
      agent_name: `Flora - ${orgName}`,
      webhook_url: webhookUrl,
    });

    // Also update the LLM with current voice config defaults
    const agent = await retell.agent.retrieve(existingAgent.retell_agent_id);
    const llmId = agent.response_engine?.type === 'retell-llm'
      ? (agent.response_engine as Record<string, unknown>).llm_id as string
      : null;
    if (llmId) {
      // Fetch voice_call_config if not provided
      let configForUpdate = voiceCallConfig;
      if (!configForUpdate) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('voice_call_config')
          .eq('id', orgId)
          .single();
        configForUpdate = (orgData?.voice_call_config as Partial<VoiceCallConfig>) || {};
      }
      const dynamicVars = buildDynamicVarsFromConfig(configForUpdate, orgName);
      await retell.llm.update(llmId, {
        general_prompt: buildLlmPrompt(voiceProfile),
        default_dynamic_variables: dynamicVars,
      });
    }

    // Update local record
    await supabase
      .from('retell_agents')
      .update({
        retell_voice_id: voiceId,
        voice_speed: voiceSpeed,
        voice_profile_hash: profileHash,
        last_synced_at: new Date().toISOString(),
        config_snapshot: {
          voiceProfile,
          voiceId,
          voiceSpeed,
          response_engine_type: 'retell-llm',
        },
      })
      .eq('id', existingAgent.id);

    return { retellAgentId: existingAgent.retell_agent_id, created: false };
  }

  // Create new Retell LLM with Flora's system prompt
  const generalPrompt = buildLlmPrompt(voiceProfile);
  const llm = await retell.llm.create({
    model: 'claude-4.5-haiku',
    model_temperature: 0.7,
    begin_message: `Hi there! This is Flora from {{org_name}}. How are you doing today?`,
    general_prompt: generalPrompt,
    general_tools: [
      {
        type: 'end_call',
        name: 'end_call',
        description: 'End the call when the conversation is complete, the contact wants to go, or after 5 minutes.',
      },
    ],
    default_dynamic_variables: buildDynamicVarsFromConfig(voiceCallConfig || {}, orgName),
  });

  // Create new Retell agent with the LLM
  const agent = await retell.agent.create({
    response_engine: {
      type: 'retell-llm',
      llm_id: llm.llm_id,
    },
    voice_id: voiceId,
    agent_name: `Flora - ${orgName}`,
    voice_speed: voiceSpeed,
    voice_temperature: 0.7,
    language: 'en-US',
    enable_backchannel: true,
    end_call_after_silence_ms: 30000,
    max_call_duration_ms: 300000, // 5 minutes
    webhook_url: webhookUrl,
  });

  // Store agent record
  await supabase.from('retell_agents').insert({
    organization_id: orgId,
    retell_agent_id: agent.agent_id,
    agent_type: 'outbound',
    agent_name: `Flora - ${orgName}`,
    retell_voice_id: voiceId,
    voice_speed: voiceSpeed,
    voice_temperature: 0.7,
    voice_profile_hash: profileHash,
    last_synced_at: new Date().toISOString(),
    config_snapshot: {
      voiceProfile,
      voiceId,
      voiceSpeed,
      llmId: llm.llm_id,
      response_engine_type: 'retell-llm',
    },
    is_active: true,
  });

  return { retellAgentId: agent.agent_id, created: true };
}

/**
 * Sync voice call config changes to an existing Retell agent's LLM.
 * Called when org saves voice config in settings.
 */
export async function syncAgentVoiceConfig(
  orgId: string,
  config: VoiceCallConfig,
  orgName: string,
): Promise<void> {
  const retell = getRetellClient();
  const supabase = createAdminClient();

  // Find org's active agent
  const { data: agentRecord } = await supabase
    .from('retell_agents')
    .select('retell_agent_id, config_snapshot')
    .eq('organization_id', orgId)
    .eq('agent_type', 'outbound')
    .eq('is_active', true)
    .single();

  if (!agentRecord) return; // No agent created yet, will pick up config on first call

  // Get agent details from Retell to find LLM ID
  const agent = await retell.agent.retrieve(agentRecord.retell_agent_id);
  const llmId = agent.response_engine?.type === 'retell-llm'
    ? (agent.response_engine as Record<string, unknown>).llm_id as string
    : null;
  if (!llmId) return;

  const dynamicVars = buildDynamicVarsFromConfig(config, orgName);

  // Fetch org's voice profile to rebuild the general prompt
  const { data: orgData } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  const voiceProfile = (orgData?.settings as Record<string, unknown>)
    ?.voiceProfile as VoiceProfile | undefined;
  const { DEFAULT_VOICE_PROFILE } = await import(
    '@/lib/ai/prompts/voice-analysis'
  );
  const profile = voiceProfile ?? DEFAULT_VOICE_PROFILE;

  // Update LLM with new defaults, greeting, and refreshed prompt
  await retell.llm.update(llmId, {
    begin_message: config.callBehavior?.greeting
      ? config.callBehavior.greeting
      : `Hi there! This is Flora from {{org_name}}. How are you doing today?`,
    general_prompt: buildLlmPrompt(profile),
    default_dynamic_variables: dynamicVars,
  });

  // Also update the agent's webhook URL to ensure it's current
  // (may have been set incorrectly during initial creation)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhooks/retell`;
  await retell.agent.update(agentRecord.retell_agent_id, {
    webhook_url: webhookUrl,
  });
}

/**
 * Get or create an outbound agent for an organization.
 * Lazy-creates the agent on first call.
 */
export async function getOrCreateAgentForOrg(
  orgId: string,
): Promise<string> {
  const supabase = createAdminClient();

  // Try to get existing active agent
  const { data: existingAgent } = await supabase
    .from('retell_agents')
    .select('retell_agent_id')
    .eq('organization_id', orgId)
    .eq('agent_type', 'outbound')
    .eq('is_active', true)
    .single();

  if (existingAgent) {
    return existingAgent.retell_agent_id;
  }

  // Need to create - fetch org voice profile and voice call config
  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings, voice_call_config')
    .eq('id', orgId)
    .single();

  if (!org) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  const voiceProfile = (org.settings as Record<string, unknown>)
    ?.voiceProfile as VoiceProfile | undefined;
  const voiceCallConfig = (org.voice_call_config as Partial<VoiceCallConfig>) || {};

  // Use default profile if none trained
  const { DEFAULT_VOICE_PROFILE } = await import(
    '@/lib/ai/prompts/voice-analysis'
  );
  const profile = voiceProfile ?? DEFAULT_VOICE_PROFILE;

  const { retellAgentId } = await createOrUpdateAgent(
    orgId,
    profile,
    org.name,
    voiceCallConfig,
  );
  return retellAgentId;
}
