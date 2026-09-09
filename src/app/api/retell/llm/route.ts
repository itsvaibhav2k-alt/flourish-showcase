/**
 * Retell Custom LLM HTTP Endpoint
 *
 * Handles conversation turns from Retell's Custom LLM mode.
 * On each turn:
 * 1. Receives user speech transcript from Retell
 * 2. Looks up voice_calls record for context_snapshot
 * 3. Builds Claude prompt with serialized context + voice instructions
 * 4. Calls Claude and returns response for Retell to synthesize as speech
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithCaching, MODELS } from '@/lib/ai/claude';
import { getVoiceInstructions, VoiceProfile } from '@/lib/ai/prompts/voice-analysis';
import { trackUsage } from '@/lib/ai/cost-tracker';

// Use service role client (this endpoint is called by Retell, not a user)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for LLM endpoint');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// Voice-specific system prompt addendum for spoken conversation
const VOICE_SYSTEM_ADDENDUM = `
VOICE CONVERSATION RULES:
- You are Flora, the AI assistant for this nonprofit organization, speaking on a phone call.
- Keep responses SHORT - 1-3 sentences max. This is a spoken conversation, not an email.
- Use natural spoken language. No bullet points, no numbered lists, no markdown.
- Use contractions (I'm, you're, we'll, don't) for natural speech.
- Avoid URLs, email addresses, or anything that doesn't translate well to speech.
- Practice active listening - acknowledge what the person said before responding.
- If you don't understand something, ask for clarification naturally.
- Be warm, friendly, and conversational while staying on topic.
- If the conversation is wrapping up, summarize any commitments or next steps briefly.
- NEVER mention that you are an AI unless directly asked.
`;

interface RetellLLMRequest {
  call_id: string;
  agent_id?: string;
  // Conversation history from Retell
  transcript: Array<{
    role: 'agent' | 'user';
    content: string;
  }>;
  // Current user input
  interaction_type: 'update_only' | 'response_required' | 'reminder_required';
}

interface RetellLLMResponse {
  response_id: number;
  content: string;
  content_complete: boolean;
  end_call: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetellLLMRequest = await request.json();
    const { call_id: retellCallId, transcript, interaction_type } = body;

    // If this is just an update (no response needed), acknowledge
    if (interaction_type === 'update_only') {
      return NextResponse.json({
        response_id: 0,
        content: '',
        content_complete: true,
        end_call: false,
      });
    }

    const supabase = getServiceClient();

    // Look up the voice call to get context
    const { data: voiceCall, error: callError } = await supabase
      .from('voice_calls')
      .select(`
        id,
        organization_id,
        contact_id,
        call_type,
        context_snapshot,
        call_script
      `)
      .eq('retell_call_id', retellCallId)
      .single();

    if (callError || !voiceCall) {
      console.error(`No voice_call found for retell_call_id: ${retellCallId}`);
      return NextResponse.json({
        response_id: 0,
        content: 'I apologize, but I seem to be having a technical issue. Could you please try calling back?',
        content_complete: true,
        end_call: true,
      });
    }

    // Get organization voice profile
    const { data: org } = await supabase
      .from('organizations')
      .select('voice_profile, name')
      .eq('id', voiceCall.organization_id)
      .single();

    const voiceProfile = org?.voice_profile as VoiceProfile | null;
    const orgName = org?.name || 'our organization';

    // Build the system prompt from context
    const contextSnapshot = voiceCall.context_snapshot as Record<string, unknown> | null;
    let contextString = '';
    if (contextSnapshot) {
      // The context_snapshot is stored as a serialized DonorContext or VolunteerContext
      contextString = typeof contextSnapshot === 'string'
        ? contextSnapshot
        : JSON.stringify(contextSnapshot, null, 2);
    }

    const voiceInstructions = getVoiceInstructions(voiceProfile);

    // Build call script context if available
    const callScript = voiceCall.call_script as Record<string, unknown> | null;
    const callScriptContext = callScript
      ? `\nCALL PURPOSE & TALKING POINTS:\n${JSON.stringify(callScript, null, 2)}\n`
      : '';

    const systemPrompt = `You are Flora, the AI communication assistant for ${orgName}.

${voiceInstructions}

${VOICE_SYSTEM_ADDENDUM}

CONTACT CONTEXT:
${contextString}
${callScriptContext}
CALL TYPE: ${voiceCall.call_type}`;

    // Build conversation history for Claude
    const messages = transcript.map((t) => ({
      role: t.role === 'agent' ? 'assistant' : 'user',
      content: t.content,
    }));

    // Determine model based on context (use Sonnet for major donors)
    const isMajorDonor = contextSnapshot &&
      typeof contextSnapshot === 'object' &&
      'giving' in contextSnapshot &&
      (contextSnapshot as { giving?: { lifetimeGiving?: number } }).giving?.lifetimeGiving
        && ((contextSnapshot as { giving: { lifetimeGiving: number } }).giving.lifetimeGiving >= 10000);

    const model = isMajorDonor ? MODELS.SONNET : MODELS.HAIKU;

    // Get the latest user message as the prompt
    const latestUserMessage = messages.filter((m) => m.role === 'user').pop();
    const userPrompt = latestUserMessage?.content || '';

    // Build conversation context for the prompt
    const conversationHistory = messages.length > 1
      ? `Previous conversation:\n${messages.slice(0, -1).map((m) => `${m.role === 'assistant' ? 'Flora' : 'Caller'}: ${m.content}`).join('\n')}\n\nCaller's latest message: ${userPrompt}`
      : userPrompt;

    const response = await generateWithCaching({
      systemPrompt,
      userPrompt: conversationHistory || 'Begin the call with a warm greeting.',
      maxTokens: 256,
      model,
      temperature: 0.7,
    });

    // Track token usage
    await trackUsage({
      organizationId: voiceCall.organization_id,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cacheCreationInputTokens: response.usage.cacheCreationInputTokens,
      cacheReadInputTokens: response.usage.cacheReadInputTokens,
      model: response.model,
      emailType: 'voice_call',
      contactId: voiceCall.contact_id,
    }).catch((err) => {
      // Don't fail the call if tracking fails
      console.error('Failed to track voice call usage:', err);
    });

    const llmResponse: RetellLLMResponse = {
      response_id: 0,
      content: response.content,
      content_complete: true,
      end_call: false,
    };

    return NextResponse.json(llmResponse);
  } catch (error) {
    console.error('Retell LLM endpoint error:', error);
    return NextResponse.json({
      response_id: 0,
      content: 'I apologize, I had a brief technical issue. Could you repeat that?',
      content_complete: true,
      end_call: false,
    });
  }
}
