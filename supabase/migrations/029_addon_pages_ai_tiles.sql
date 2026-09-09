-- Migration 029: Add-On Pages & AI-Powered Tiles
-- Creates tables for AI tile cache, custom AI tiles, grant applications, and campaigns

-- ============================================================================
-- AI_TILE_CACHE TABLE
-- Stores pre-computed AI tile insights with expiration for caching
-- ============================================================================
CREATE TABLE ai_tile_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tile_type TEXT NOT NULL,
  tile_id TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(organization_id, tile_type, tile_id)
);

-- Indexes for ai_tile_cache
CREATE INDEX idx_ai_tile_cache_org_id ON ai_tile_cache(organization_id);
CREATE INDEX idx_ai_tile_cache_expires_at ON ai_tile_cache(expires_at);
CREATE INDEX idx_ai_tile_cache_org_type ON ai_tile_cache(organization_id, tile_type);

-- Enable RLS
ALTER TABLE ai_tile_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_tile_cache
CREATE POLICY "ai_tile_cache_all" ON ai_tile_cache
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- CUSTOM_AI_TILES TABLE
-- Admin-created custom AI tiles with prompts and data sources
-- ============================================================================
CREATE TABLE custom_ai_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL CHECK (char_length(prompt) <= 500),
  data_sources TEXT[] DEFAULT '{}',
  refresh_schedule TEXT NOT NULL DEFAULT 'daily' CHECK (refresh_schedule IN ('daily', 'weekly', 'manual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for custom_ai_tiles
CREATE INDEX idx_custom_ai_tiles_org_id ON custom_ai_tiles(organization_id);
CREATE INDEX idx_custom_ai_tiles_is_active ON custom_ai_tiles(is_active) WHERE is_active = TRUE;

-- Updated_at trigger
CREATE TRIGGER update_custom_ai_tiles_updated_at
  BEFORE UPDATE ON custom_ai_tiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE custom_ai_tiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_ai_tiles
-- All org members can read
CREATE POLICY "custom_ai_tiles_select" ON custom_ai_tiles
  FOR SELECT USING (
    organization_id IN (SELECT user_org_ids())
  );

-- Only admins can insert/update/delete (implementation note: admin check would need to be added later)
-- For now, allowing all org members to manage tiles
CREATE POLICY "custom_ai_tiles_insert" ON custom_ai_tiles
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "custom_ai_tiles_update" ON custom_ai_tiles
  FOR UPDATE USING (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "custom_ai_tiles_delete" ON custom_ai_tiles
  FOR DELETE USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- GRANT_APPLICATIONS TABLE
-- For Grant Tracker add-on - manage grant applications and reporting
-- ============================================================================
CREATE TABLE grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  funder_name TEXT NOT NULL,
  funder_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  grant_name TEXT,
  amount_requested NUMERIC(12,2),
  amount_awarded NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending', 'approved', 'declined', 'reporting')),
  deadline DATE,
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  reporting_due DATE,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for grant_applications
CREATE INDEX idx_grant_applications_org_id ON grant_applications(organization_id);
CREATE INDEX idx_grant_applications_status ON grant_applications(organization_id, status);
CREATE INDEX idx_grant_applications_funder_contact ON grant_applications(funder_contact_id);
CREATE INDEX idx_grant_applications_deadline ON grant_applications(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_grant_applications_reporting_due ON grant_applications(reporting_due) WHERE reporting_due IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_grant_applications_updated_at
  BEFORE UPDATE ON grant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grant_applications
CREATE POLICY "grant_applications_all" ON grant_applications
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- CAMPAIGNS TABLE
-- For Campaign Central add-on - manage fundraising and awareness campaigns
-- ============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'fundraising' CHECK (campaign_type IN ('fundraising', 'awareness', 'event', 'annual', 'capital')),
  goal_amount NUMERIC(12,2),
  raised_amount NUMERIC(12,2) DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  target_audience JSONB,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(organization_id, status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_type ON campaigns(organization_id, campaign_type);

-- Updated_at trigger
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "campaigns_all" ON campaigns
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- CAMPAIGN_GIFTS TABLE
-- Links gifts to campaigns for tracking campaign performance
-- ============================================================================
CREATE TABLE campaign_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, gift_id)
);

-- Indexes for campaign_gifts
CREATE INDEX idx_campaign_gifts_campaign_id ON campaign_gifts(campaign_id);
CREATE INDEX idx_campaign_gifts_gift_id ON campaign_gifts(gift_id);

-- Enable RLS
ALTER TABLE campaign_gifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_gifts
-- Users can access campaign_gifts if they have access to the campaign
CREATE POLICY "campaign_gifts_select" ON campaign_gifts
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "campaign_gifts_insert" ON campaign_gifts
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "campaign_gifts_delete" ON campaign_gifts
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update campaign stats when gifts are linked/unlinked
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  -- Determine which campaign to update
  IF TG_OP = 'DELETE' THEN
    v_campaign_id := OLD.campaign_id;
  ELSE
    v_campaign_id := NEW.campaign_id;
  END IF;

  -- Update campaign raised_amount and donor_count
  UPDATE campaigns
  SET
    raised_amount = COALESCE((
      SELECT SUM(g.amount)
      FROM campaign_gifts cg
      JOIN gifts g ON g.id = cg.gift_id
      WHERE cg.campaign_id = v_campaign_id
    ), 0),
    donor_count = (
      SELECT COUNT(DISTINCT g.contact_id)
      FROM campaign_gifts cg
      JOIN gifts g ON g.id = cg.gift_id
      WHERE cg.campaign_id = v_campaign_id
    ),
    updated_at = NOW()
  WHERE id = v_campaign_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign stats
CREATE TRIGGER update_campaign_stats_on_gift_link
  AFTER INSERT OR DELETE ON campaign_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Also update when gift amount changes
CREATE OR REPLACE FUNCTION update_campaign_stats_on_gift_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all campaigns this gift is linked to
  PERFORM update_campaign_stats()
  FROM campaign_gifts
  WHERE gift_id = NEW.id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_on_gift_update
  AFTER UPDATE OF amount ON gifts
  FOR EACH ROW
  WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
  EXECUTE FUNCTION update_campaign_stats_on_gift_change();
