-- Migration 049: Make voice_calls.contact_id nullable for inbound calls
-- Inbound callers may not match any existing contact in the system.

ALTER TABLE voice_calls ALTER COLUMN contact_id DROP NOT NULL;

-- Add missing call types to the check constraint
ALTER TABLE voice_calls DROP CONSTRAINT IF EXISTS voice_calls_call_type_check;
ALTER TABLE voice_calls ADD CONSTRAINT voice_calls_call_type_check CHECK (call_type IN (
  'thank_you', 'reengagement', 'shift_reminder',
  'cultivation', 'campaign_outreach', 'custom',
  'donation_ask', 'volunteer_recruitment', 'event_invitation',
  'follow_up', 'survey'
));
