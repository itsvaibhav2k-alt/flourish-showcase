-- Migration 016: Copilot Actions
-- AI-powered action suggestions for contact engagement

-- ============================================================================
-- COPILOT_ACTIONS TABLE
-- ============================================================================
CREATE TABLE copilot_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('reach_out', 'send_ask', 're_engage', 'thank', 'follow_up')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 10),
    reasoning TEXT NOT NULL,
    suggested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    outcome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_copilot_actions_org_id ON copilot_actions(organization_id);
CREATE INDEX idx_copilot_actions_contact_id ON copilot_actions(contact_id);
CREATE INDEX idx_copilot_actions_action_type ON copilot_actions(action_type);
CREATE INDEX idx_copilot_actions_priority ON copilot_actions(priority DESC);
CREATE INDEX idx_copilot_actions_suggested_at ON copilot_actions(suggested_at DESC);
CREATE INDEX idx_copilot_actions_pending ON copilot_actions(organization_id, priority DESC)
    WHERE completed_at IS NULL AND dismissed_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE copilot_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY copilot_actions_select_policy ON copilot_actions
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY copilot_actions_insert_policy ON copilot_actions
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY copilot_actions_update_policy ON copilot_actions
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY copilot_actions_delete_policy ON copilot_actions
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));
