-- Migration 015: Donations
-- Online donations with Stripe integration and receipt tracking

-- ============================================================================
-- DONATIONS TABLE
-- ============================================================================
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    donation_form_id UUID REFERENCES donation_forms(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    donor_email TEXT NOT NULL,
    donor_name TEXT,
    donor_phone TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    receipt_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_donations_org_id ON donations(organization_id);
CREATE INDEX idx_donations_contact_id ON donations(contact_id);
CREATE INDEX idx_donations_donation_form_id ON donations(donation_form_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_stripe_payment_intent ON donations(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_donations_stripe_subscription ON donations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_donations_donor_email ON donations(donor_email);
CREATE INDEX idx_donations_receipt_sent ON donations(receipt_sent_at) WHERE receipt_sent_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to create a gift record when donation is completed
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
            notes
        ) VALUES (
            NEW.organization_id,
            NEW.contact_id,
            (NEW.amount::DECIMAL / 100), -- Convert cents to dollars
            NEW.created_at,
            CASE WHEN NEW.is_recurring THEN 'recurring' ELSE 'one-time' END,
            'credit_card',
            'Online donation via form ID: ' || COALESCE(NEW.donation_form_id::TEXT, 'unknown')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_create_gift
    AFTER UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION create_gift_from_donation();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY donations_select_policy ON donations
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donations_insert_policy ON donations
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donations_update_policy ON donations
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donations_delete_policy ON donations
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));
