/**
 * Voice Calls Module
 *
 * AI-powered voice calling with Flora for personalized donor
 * and volunteer outreach via Retell AI.
 */

// Actions
export { initiateCall } from './actions/initiate-call';
export { scheduleCall } from './actions/schedule-call';

// Queries
export { getCallHistory, getOrgCallHistory } from './queries/get-call-history';
export { getCallTranscript } from './queries/get-call-transcript';

// Services
export { buildCallContext, type CallContext } from './services/call-context-builder';

// Config
export { CALL_TYPE_CONFIG, getFloraInstructions, type CallTypeConfig } from './config/call-types';

// Schemas
export {
  VoiceCallType,
  VoiceCallStatus,
  VoiceCallDirection,
  CallOutcome,
  CallSentiment,
  InitiateCallParams,
  ScheduleCallParams,
  type VoiceCallRecord,
  type CallTranscriptRecord,
} from './schemas/call.schema';

// Components
export { CallButton } from './components/call-button';
export { WebCallDialog } from './components/web-call-dialog';
export { CallHistoryPanel } from './components/call-history-panel';
export { CallTranscriptViewer } from './components/call-transcript-viewer';
export { VoiceSettingsPanel } from './components/voice-settings-panel';
export { CallAnalyticsDashboard } from './components/call-analytics-dashboard';
export { VoiceConfigPage } from './components/voice-config-page';
export { OrgKnowledgeEditor } from './components/org-knowledge-editor';
export { CallBehaviorEditor } from './components/call-behavior-editor';
export { CallScriptsEditor } from './components/call-scripts-editor';
