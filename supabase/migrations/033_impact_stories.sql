-- Impact Stories Migration
-- Creates tables for impact metrics and personalized donor impact stories
-- NOTE: Some of these objects may already exist from 021_dynamic_impact_stories.sql

-- Table 1: impact_metrics
CREATE TABLE IF NOT EXISTS impact_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    description TEXT,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    unit_label TEXT NOT NULL,
    unit_label_plural TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: impact_stories
CREATE TABLE IF NOT EXISTS impact_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_content TEXT NOT NULL,
    metrics JSONB NOT NULL,
    total_giving DECIMAL(12,2) NOT NULL,
    period_start DATE,
    period_end DATE,
    share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_public BOOLEAN DEFAULT true,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns that may be missing from 021 migration
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS story_content TEXT;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS metrics JSONB;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE impact_stories ADD COLUMN IF NOT EXISTS period_end DATE;

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_impact_metrics_organization_id ON impact_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_active ON impact_metrics(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_display_order ON impact_metrics(organization_id, display_order);
CREATE INDEX IF NOT EXISTS idx_impact_stories_organization_id ON impact_stories(organization_id);
CREATE INDEX IF NOT EXISTS idx_impact_stories_contact_id ON impact_stories(contact_id);
CREATE INDEX IF NOT EXISTS idx_impact_stories_share_token ON impact_stories(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impact_stories_org_contact ON impact_stories(organization_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_impact_stories_sent ON impact_stories(organization_id, sent_at) WHERE sent_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exist, then recreate)
DROP POLICY IF EXISTS "Users can view impact metrics for their organization" ON impact_metrics;
CREATE POLICY "Users can view impact metrics for their organization"
    ON impact_metrics FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert impact metrics for their organization" ON impact_metrics;
CREATE POLICY "Users can insert impact metrics for their organization"
    ON impact_metrics FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update impact metrics for their organization" ON impact_metrics;
CREATE POLICY "Users can update impact metrics for their organization"
    ON impact_metrics FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete impact metrics for their organization" ON impact_metrics;
CREATE POLICY "Users can delete impact metrics for their organization"
    ON impact_metrics FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view impact stories for their organization" ON impact_stories;
CREATE POLICY "Users can view impact stories for their organization"
    ON impact_stories FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view impact stories via share token" ON impact_stories;
CREATE POLICY "Public can view impact stories via share token"
    ON impact_stories FOR SELECT
    USING (share_token IS NOT NULL AND is_public = true);

DROP POLICY IF EXISTS "Users can insert impact stories for their organization" ON impact_stories;
CREATE POLICY "Users can insert impact stories for their organization"
    ON impact_stories FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update impact stories for their organization" ON impact_stories;
CREATE POLICY "Users can update impact stories for their organization"
    ON impact_stories FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete impact stories for their organization" ON impact_stories;
CREATE POLICY "Users can delete impact stories for their organization"
    ON impact_stories FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Triggers
CREATE OR REPLACE FUNCTION update_impact_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS impact_metrics_updated_at ON impact_metrics;
CREATE TRIGGER impact_metrics_updated_at
    BEFORE UPDATE ON impact_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_metrics_updated_at();

CREATE OR REPLACE FUNCTION update_impact_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS impact_stories_updated_at ON impact_stories;
CREATE TRIGGER impact_stories_updated_at
    BEFORE UPDATE ON impact_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_impact_stories_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_story_view_count(story_token TEXT)
RETURNS void AS $$
BEGIN
    UPDATE impact_stories
    SET view_count = view_count + 1
    WHERE share_token = story_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE impact_metrics IS 'Organization-level metrics for calculating donor impact';
COMMENT ON TABLE impact_stories IS 'Personalized AI-generated impact stories for individual donors with shareable public links';
