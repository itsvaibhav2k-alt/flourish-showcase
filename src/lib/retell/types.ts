/**
 * Retell AI Type Definitions
 *
 * TypeScript interfaces for Retell webhook payloads, call types,
 * agent configuration, and voice call domain types.
 */

// ============================================================================
// Call Domain Types
// ============================================================================

export type VoiceCallType =
  | 'thank_you'
  | 'reengagement'
  | 'shift_reminder'
  | 'cultivation'
  | 'campaign_outreach'
  | 'custom';

export type VoiceCallStatus =
  | 'scheduled'
  | 'queued'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy'
  | 'voicemail'
  | 'cancelled';

export type VoiceCallDirection = 'outbound' | 'inbound';

export type CallOutcome = string;

export type CallSentiment =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative';

export type RetellAgentType = 'outbound' | 'inbound';

// ============================================================================
// Webhook Types
// ============================================================================

export type RetellWebhookEventType =
  | 'call_started'
  | 'call_ended'
  | 'call_analyzed';

export interface RetellWebhookEvent {
  event: RetellWebhookEventType;
  call: RetellCallEvent;
}

export interface RetellCallEvent {
  call_id: string;
  agent_id: string;
  call_type: 'web_call' | 'phone_call';
  from_number?: string;
  to_number?: string;
  direction: 'inbound' | 'outbound';
  call_status: 'registered' | 'ongoing' | 'ended' | 'error';
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  disconnection_reason?: string;
  transcript?: string;
  transcript_object?: TranscriptEntry[];
  call_analysis?: CallAnalysis;
  metadata?: Record<string, unknown>;
}

export interface TranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  words?: TranscriptWord[];
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface CallAnalysis {
  call_summary?: string;
  user_sentiment?: 'Negative' | 'Positive' | 'Neutral' | 'Unknown';
  call_successful?: boolean;
  custom_analysis_data?: Record<string, unknown>;
}

// ============================================================================
// Agent Configuration Types
// ============================================================================

export interface RetellAgentConfig {
  agentName: string;
  voiceId: string;
  voiceSpeed: number;
  voiceTemperature: number;
  llmWebsocketUrl: string;
  webhookUrl: string;
  language?: string;
  enableBackchannel?: boolean;
  endCallAfterSilenceMs?: number;
  maxCallDurationMs?: number;
}

// ============================================================================
// Custom LLM WebSocket Types
// ============================================================================

export interface RetellLlmRequest {
  interaction_type: 'update_only' | 'response_required' | 'reminder_required';
  transcript: TranscriptEntry[];
  response_id?: number;
}

export interface RetellLlmResponse {
  response_id: number;
  content: string;
  content_complete: boolean;
  end_call?: boolean;
}

// ============================================================================
// Voice Call Record (matches DB schema)
// ============================================================================

export interface VoiceCallRecord {
  id: string;
  organization_id: string;
  contact_id: string;
  retell_call_id: string | null;
  retell_agent_id: string | null;
  call_type: VoiceCallType;
  direction: VoiceCallDirection;
  status: VoiceCallStatus;
  from_phone: string | null;
  to_phone: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  context_snapshot: Record<string, unknown>;
  call_script: Record<string, unknown>;
  trigger_event: string | null;
  trigger_event_id: string | null;
  outcome: string | null;
  sentiment: CallSentiment | null;
  follow_up_needed: boolean;
  follow_up_notes: string | null;
  estimated_cost: number;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Call Transcript Record (matches DB schema)
// ============================================================================

export interface CallTranscriptRecord {
  id: string;
  call_id: string;
  organization_id: string;
  transcript: TranscriptEntry[];
  summary: string | null;
  key_topics: string[];
  action_items: string[];
  sentiment_analysis: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
