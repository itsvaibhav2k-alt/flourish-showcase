-- Migration 014: Donation Forms
-- Public donation forms with customizable amounts and settings

-- ============================================================================
-- DONATION_FORMS TABLE
-- ============================================================================
CREATE TABLE donation_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    suggested_amounts JSONB DEFAULT '[]'::jsonb,
    allow_custom_amount BOOLEAN NOT NULL DEFAULT true,
    allow_recurring BOOLEAN NOT NULL DEFAULT true,
    default_amount INTEGER,
    button_text TEXT NOT NULL DEFAULT 'Donate',
    thank_you_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_donation_forms_org_id ON donation_forms(organization_id);
CREATE INDEX idx_donation_forms_slug ON donation_forms(organization_id, slug);
CREATE INDEX idx_donation_forms_is_active ON donation_forms(is_active) WHERE is_active = TRUE;

-- Updated_at trigger
CREATE TRIGGER update_donation_forms_updated_at
    BEFORE UPDATE ON donation_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE donation_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY donation_forms_select_policy ON donation_forms
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donation_forms_insert_policy ON donation_forms
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donation_forms_update_policy ON donation_forms
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donation_forms_delete_policy ON donation_forms
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));
