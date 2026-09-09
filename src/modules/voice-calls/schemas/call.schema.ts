import { z } from 'zod';

/**
 * Voice call type enum - matches database call_type column
 */
export const VoiceCallType = z.enum([
  'thank_you',
  'reengagement',
  'donation_ask',
  'volunteer_recruitment',
  'shift_reminder',
  'event_invitation',
  'cultivation',
  'campaign_outreach',
  'follow_up',
  'survey',
  'custom',
  'sponsor_outreach',
  'employer_match',
  'fee_reminder',
]);
export type VoiceCallType = z.infer<typeof VoiceCallType>;

/**
 * Voice call status enum - matches database status column
 */
export const VoiceCallStatus = z.enum([
  'scheduled',
  'queued',
  'ringing',
  'in_progress',
  'completed',
  'failed',
  'no_answer',
  'busy',
  'voicemail',
  'cancelled',
]);
export type VoiceCallStatus = z.infer<typeof VoiceCallStatus>;

/**
 * Voice call direction enum
 */
export const VoiceCallDirection = z.enum(['outbound', 'inbound']);
export type VoiceCallDirection = z.infer<typeof VoiceCallDirection>;

/**
 * Call outcome enum - post-call classification
 */
export const CallOutcome = z.enum([
  'connected',
  'voicemail_left',
  'no_answer',
  'busy',
  'wrong_number',
  'callback_requested',
  'declined',
  'completed_positive',
  'completed_neutral',
  'completed_negative',
]);
export type CallOutcome = z.infer<typeof CallOutcome>;

/**
 * Call sentiment enum - overall call sentiment
 */
export const CallSentiment = z.enum([
  'very_positive',
  'positive',
  'neutral',
  'negative',
  'very_negative',
]);
export type CallSentiment = z.infer<typeof CallSentiment>;

/**
 * Parameters for initiating a voice call
 */
export const InitiateCallParams = z.object({
  contactId: z.string().uuid(),
  callType: VoiceCallType,
  scheduledFor: z.string().datetime().optional(),
});
export type InitiateCallParams = z.infer<typeof InitiateCallParams>;

/**
 * Parameters for scheduling a future voice call
 */
export const ScheduleCallParams = z.object({
  contactId: z.string().uuid(),
  callType: VoiceCallType,
  scheduledFor: z.string().datetime(),
  notes: z.string().optional(),
});
export type ScheduleCallParams = z.infer<typeof ScheduleCallParams>;

/**
 * Voice call record - matches the voice_calls database table
 */
export interface VoiceCallRecord {
  id: string;
  organization_id: string;
  contact_id: string;
  retell_call_id: string | null;
  retell_agent_id: string | null;
  call_type: VoiceCallType;
  direction: 'outbound' | 'inbound';
  status: VoiceCallStatus;
  from_phone: string | null;
  to_phone: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  context_snapshot: Record<string, unknown> | null;
  call_script: Record<string, unknown> | null;
  trigger_event: string | null;
  trigger_event_id: string | null;
  outcome: string | null;
  sentiment: string | null;
  follow_up_needed: boolean;
  follow_up_notes: string | null;
  estimated_cost: number | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Call transcript record - matches the call_transcripts database table
 */
export interface CallTranscriptRecord {
  id: string;
  call_id: string;
  organization_id: string;
  transcript: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp: number;
  }>;
  summary: string | null;
  key_topics: string[];
  action_items: string[];
  sentiment_analysis: Record<string, unknown> | null;
  created_at: string;
}
