-- Dynamic Impact Stories Migration
-- Creates tables for program metrics and personalized impact stories

-- Table 1: program_metrics
-- Stores organization-level metrics for different programs
CREATE TABLE program_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- e.g., "meals served", "families housed", "students tutored"
    metric_value INTEGER NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL NOT NULL, -- cost per meal, per family housed, etc.
    time_period TEXT NOT NULL, -- e.g., "2024", "Q4 2024", "December 2024"
    description TEXT,
    icon TEXT, -- emoji or icon name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: impact_stories
-- Stores personalized impact stories for individual donors
CREATE TABLE impact_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    time_period TEXT NOT NULL, -- e.g., "2024", "all-time"
    total_giving DECIMAL NOT NULL,
    headline TEXT, -- e.g., "You changed 47 lives"
    narrative TEXT, -- AI-generated story
    impact_breakdown JSONB, -- e.g., {"meals": 127, "families": 2}
    card_image_url TEXT, -- for social sharing
    share_token TEXT UNIQUE, -- for public share links
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for program_metrics
CREATE INDEX idx_program_metrics_organization_id ON program_metrics(organization_id);
CREATE INDEX idx_program_metrics_time_period ON program_metrics(time_period);
CREATE INDEX idx_program_metrics_org_time ON program_metrics(organization_id, time_period);

-- Indexes for impact_stories
CREATE INDEX idx_impact_stories_contact_id ON impact_stories(contact_id);
CREATE INDEX idx_impact_stories_organization_id ON impact_stories(organization_id);
CREATE INDEX idx_impact_stories_share_token ON impact_stories(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_impact_stories_contact_org ON impact_stories(contact_id, organization_id);

-- Enable Row Level Security
ALTER TABLE program_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for program_metrics
-- Users can view metrics for their organization
CREATE POLICY "Users can view program metrics for their organization"
    ON program_metrics
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert metrics for their organization
CREATE POLICY "Users can insert program metrics for their organization"
    ON program_metrics
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can update metrics for their organization
CREATE POLICY "Users can update program metrics for their organization"
    ON program_metrics
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete metrics for their organization
CREATE POLICY "Users can delete program metrics for their organization"
    ON program_metrics
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for impact_stories
-- Users can view impact stories for their organization
CREATE POLICY "Users can view impact stories for their organization"
    ON impact_stories
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Public can view impact stories via share token
CREATE POLICY "Public can view impact stories via share token"
    ON impact_stories
    FOR SELECT
    USING (share_token IS NOT NULL);

-- Users can insert impact stories for their organization
CREATE POLICY "Users can insert impact stories for their organization"
    ON impact_stories
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can update impact stories for their organization
CREATE POLICY "Users can update impact stories for their organization"
    ON impact_stories
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete impact stories for their organization
CREATE POLICY "Users can delete impact stories for their organization"
    ON impact_stories
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp for program_metrics
CREATE OR REPLACE FUNCTION update_program_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_metrics_updated_at
    BEFORE UPDATE ON program_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_program_metrics_updated_at();

-- Comments for documentation
COMMENT ON TABLE program_metrics IS 'Stores organization-level metrics for different programs to calculate donor impact';
COMMENT ON TABLE impact_stories IS 'Stores personalized impact stories for individual donors based on their contributions';
COMMENT ON COLUMN program_metrics.metric_name IS 'The name of the metric being tracked (e.g., "meals served", "families housed")';
COMMENT ON COLUMN program_metrics.cost_per_unit IS 'The cost per unit of this metric (e.g., cost per meal)';
COMMENT ON COLUMN impact_stories.impact_breakdown IS 'JSONB object mapping metric types to calculated impact numbers';
COMMENT ON COLUMN impact_stories.share_token IS 'Unique token for public sharing of impact stories';
