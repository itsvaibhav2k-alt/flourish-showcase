-- Add automation settings columns to organizations table
-- These settings control automatic email sending behavior

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS auto_thank_you_emails boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_volunteer_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_volunteer_confirmations boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_email_generation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_hours_before integer DEFAULT 24 CHECK (reminder_hours_before >= 1 AND reminder_hours_before <= 168);

-- Add comments for documentation
COMMENT ON COLUMN organizations.auto_thank_you_emails IS 'Automatically send thank-you emails for donations (false = requires manual review)';
COMMENT ON COLUMN organizations.auto_volunteer_reminders IS 'Automatically send volunteer shift reminder emails';
COMMENT ON COLUMN organizations.auto_volunteer_confirmations IS 'Automatically send volunteer shift confirmation emails';
COMMENT ON COLUMN organizations.ai_email_generation IS 'Enable AI-powered email generation using Claude';
COMMENT ON COLUMN organizations.reminder_hours_before IS 'Hours before shift to send reminder (1-168 hours, default 24)';
