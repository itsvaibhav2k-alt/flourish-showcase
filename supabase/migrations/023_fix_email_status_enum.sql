-- Fix email_drafts status constraint to include all statuses used by the application
-- The original schema only allowed: 'draft', 'reviewed', 'sent', 'failed'
-- But the code uses: 'approved', 'rejected', 'pending'

ALTER TABLE email_drafts DROP CONSTRAINT IF EXISTS email_drafts_status_check;
ALTER TABLE email_drafts ADD CONSTRAINT email_drafts_status_check
  CHECK (status IN ('draft', 'pending', 'reviewed', 'approved', 'rejected', 'sent', 'failed'));
