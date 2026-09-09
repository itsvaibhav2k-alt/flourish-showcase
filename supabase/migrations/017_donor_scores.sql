-- Migration 017: Donor Scores
-- AI-powered donor engagement scoring and predictions

-- ============================================================================
-- DONOR_SCORES TABLE
-- ============================================================================
CREATE TABLE donor_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    giving_likelihood INTEGER NOT NULL CHECK (giving_likelihood >= 0 AND giving_likelihood <= 100),
    predicted_amount INTEGER CHECK (predicted_amount > 0),
    optimal_ask_date DATE,
    preferred_channel TEXT CHECK (preferred_channel IN ('email', 'phone', 'mail', 'in_person')),
    score_reasoning TEXT NOT NULL,
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, contact_id)
);

-- Indexes for performance
CREATE INDEX idx_donor_scores_org_id ON donor_scores(organization_id);
CREATE INDEX idx_donor_scores_contact_id ON donor_scores(contact_id);
CREATE INDEX idx_donor_scores_giving_likelihood ON donor_scores(giving_likelihood DESC);
CREATE INDEX idx_donor_scores_predicted_amount ON donor_scores(predicted_amount DESC) WHERE predicted_amount IS NOT NULL;
CREATE INDEX idx_donor_scores_optimal_ask_date ON donor_scores(optimal_ask_date) WHERE optimal_ask_date IS NOT NULL;
CREATE INDEX idx_donor_scores_last_calculated ON donor_scores(last_calculated_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_donor_scores_updated_at
    BEFORE UPDATE ON donor_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE donor_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY donor_scores_select_policy ON donor_scores
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donor_scores_insert_policy ON donor_scores
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donor_scores_update_policy ON donor_scores
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY donor_scores_delete_policy ON donor_scores
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));
