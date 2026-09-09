-- Migration 040: Matching Gifts Integration
-- Adds fields to track employer matching gift programs

-- Add matching gift settings to organizations
ALTER TABLE organizations ADD COLUMN double_the_donation_public_key TEXT;
ALTER TABLE organizations ADD COLUMN matching_gifts_enabled BOOLEAN DEFAULT false;

-- Add matching gift fields to donations table (online donations)
ALTER TABLE donations ADD COLUMN employer_name TEXT;
ALTER TABLE donations ADD COLUMN matching_gift_eligible BOOLEAN;
ALTER TABLE donations ADD COLUMN matching_gift_status TEXT CHECK (
  matching_gift_status IN ('unknown', 'eligible', 'submitted', 'received', 'ineligible')
);
ALTER TABLE donations ADD COLUMN matching_gift_company_id TEXT;
ALTER TABLE donations ADD COLUMN matching_gift_ratio DECIMAL(4,2);
ALTER TABLE donations ADD COLUMN matching_gift_amount DECIMAL(12,2);
ALTER TABLE donations ADD COLUMN matching_gift_received_at TIMESTAMPTZ;
ALTER TABLE donations ADD COLUMN matching_gift_reminder_sent_at TIMESTAMPTZ;

-- Add matching gift fields to gifts table (manual gift entry)
ALTER TABLE gifts ADD COLUMN employer_name TEXT;
ALTER TABLE gifts ADD COLUMN matching_gift_eligible BOOLEAN;
ALTER TABLE gifts ADD COLUMN matching_gift_status TEXT CHECK (
  matching_gift_status IN ('unknown', 'eligible', 'submitted', 'received', 'ineligible')
);
ALTER TABLE gifts ADD COLUMN matching_gift_company_id TEXT;
ALTER TABLE gifts ADD COLUMN matching_gift_ratio DECIMAL(4,2);
ALTER TABLE gifts ADD COLUMN matching_gift_amount DECIMAL(12,2);
ALTER TABLE gifts ADD COLUMN matching_gift_received_at TIMESTAMPTZ;
ALTER TABLE gifts ADD COLUMN matching_gift_reminder_sent_at TIMESTAMPTZ;

-- Index for finding match-eligible donations that need reminders
CREATE INDEX idx_donations_matching_eligible ON donations(matching_gift_eligible, matching_gift_status)
WHERE matching_gift_eligible = true AND matching_gift_status IN ('unknown', 'eligible');

-- Index for finding match-eligible gifts that need reminders
CREATE INDEX idx_gifts_matching_eligible ON gifts(matching_gift_eligible, matching_gift_status)
WHERE matching_gift_eligible = true AND matching_gift_status IN ('unknown', 'eligible');

-- Index for matching gift reporting
CREATE INDEX idx_donations_matching_received ON donations(matching_gift_received_at)
WHERE matching_gift_received_at IS NOT NULL;

CREATE INDEX idx_gifts_matching_received ON gifts(matching_gift_received_at)
WHERE matching_gift_received_at IS NOT NULL;

-- Update gift creation trigger to include matching gift fields
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
            tribute_message,
            employer_name,
            matching_gift_eligible,
            matching_gift_status,
            matching_gift_company_id,
            matching_gift_ratio
        ) VALUES (
            NEW.organization_id,
            NEW.contact_id,
            (NEW.amount::DECIMAL / 100),
            NEW.created_at,
            CASE WHEN NEW.is_recurring THEN 'recurring' ELSE 'one-time' END,
            'credit_card',
            'Online donation via form ID: ' || COALESCE(NEW.donation_form_id::TEXT, 'unknown'),
            NEW.tribute_type,
            NEW.tribute_name,
            NEW.tribute_notify_email,
            NEW.tribute_notify_name,
            NEW.tribute_message,
            NEW.employer_name,
            NEW.matching_gift_eligible,
            COALESCE(NEW.matching_gift_status, 'unknown'),
            NEW.matching_gift_company_id,
            NEW.matching_gift_ratio
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
