-- Fix email_drafts table schema to match application code
-- This migration adds missing columns and fixes constraint mismatches

-- Add missing columns to email_drafts
ALTER TABLE email_drafts
ADD COLUMN IF NOT EXISTS sent_by UUID,
ADD COLUMN IF NOT EXISTS resend_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update email_type constraint to include all types used by code
ALTER TABLE email_drafts DROP CONSTRAINT IF EXISTS email_drafts_email_type_check;
ALTER TABLE email_drafts ADD CONSTRAINT email_drafts_email_type_check
  CHECK (email_type IN (
    'thank_you', 'confirmation', 'reminder', 'follow_up', 'welcome', 'custom',
    'volunteer_confirmation', 'volunteer_reminder', 'volunteer_thank_you', 'reengagement'
  ));

-- Update trigger_event constraint to include 'gift' value used by code
ALTER TABLE email_drafts DROP CONSTRAINT IF EXISTS email_drafts_trigger_event_check;
ALTER TABLE email_drafts ADD CONSTRAINT email_drafts_trigger_event_check
  CHECK (trigger_event IN (
    'gift_received', 'gift', 'shift_signup', 'shift_reminder', 'shift_completed', 'manual'
  ) OR trigger_event IS NULL);

-- Add index on resend_id for delivery status checks
CREATE INDEX IF NOT EXISTS idx_email_drafts_resend_id ON email_drafts(resend_id) WHERE resend_id IS NOT NULL;

-- Add trigger to update updated_at (reuse existing function from 001_initial_schema.sql)
DROP TRIGGER IF EXISTS update_email_drafts_updated_at ON email_drafts;
CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
