-- Migration 039: Tribute/Memorial Giving
-- Adds fields to support "in honor of" and "in memory of" donations

-- Add tribute fields to donations table (online donations)
ALTER TABLE donations ADD COLUMN tribute_type TEXT CHECK (tribute_type IN ('honor', 'memory'));
ALTER TABLE donations ADD COLUMN tribute_name TEXT;
ALTER TABLE donations ADD COLUMN tribute_notify_email TEXT;
ALTER TABLE donations ADD COLUMN tribute_notify_name TEXT;
ALTER TABLE donations ADD COLUMN tribute_message TEXT;
ALTER TABLE donations ADD COLUMN tribute_notification_sent_at TIMESTAMPTZ;

-- Add tribute fields to gifts table (manual gift entry)
ALTER TABLE gifts ADD COLUMN tribute_type TEXT CHECK (tribute_type IN ('honor', 'memory'));
ALTER TABLE gifts ADD COLUMN tribute_name TEXT;
ALTER TABLE gifts ADD COLUMN tribute_notify_email TEXT;
ALTER TABLE gifts ADD COLUMN tribute_notify_name TEXT;
ALTER TABLE gifts ADD COLUMN tribute_message TEXT;
ALTER TABLE gifts ADD COLUMN tribute_notification_sent_at TIMESTAMPTZ;

-- Index for finding donations that need tribute notifications
CREATE INDEX idx_donations_tribute_pending ON donations(tribute_type)
WHERE tribute_type IS NOT NULL
  AND tribute_notify_email IS NOT NULL
  AND tribute_notification_sent_at IS NULL;

-- Index for finding gifts that need tribute notifications
CREATE INDEX idx_gifts_tribute_pending ON gifts(tribute_type)
WHERE tribute_type IS NOT NULL
  AND tribute_notify_email IS NOT NULL
  AND tribute_notification_sent_at IS NULL;

-- Update the gift creation trigger to include tribute fields
CREATE OR REPLACE FUNCTION create_gift_from_donation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create gift if status changed to 'completed' and contact_id exists
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.contact_id IS NOT NULL THEN
        INSERT INTO gifts (
            organization_id,
            contact_id,
            amount,
            gift_date,
            gift_type,
            payment_method,
            notes,
            tribute_type,
            tribute_name,
            tribute_notify_email,
            tribute_notify_name,
            tribute_message
        ) VALUES (
            NEW.organization_id,
            NEW.contact_id,
            (NEW.amount::DECIMAL / 100), -- Convert cents to dollars
            NEW.created_at,
            CASE WHEN NEW.is_recurring THEN 'recurring' ELSE 'one-time' END,
            'credit_card',
            'Online donation via form ID: ' || COALESCE(NEW.donation_form_id::TEXT, 'unknown'),
            NEW.tribute_type,
            NEW.tribute_name,
            NEW.tribute_notify_email,
            NEW.tribute_notify_name,
            NEW.tribute_message
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
