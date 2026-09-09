-- Migration: Giving Potential (Wealth Screening)
-- Description: Add giving_potential table for wealth screening and major gift prospect identification

-- Create giving_potential table
CREATE TABLE IF NOT EXISTS giving_potential (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Wealth indicators
  estimated_net_worth DECIMAL,
  real_estate_value DECIMAL,
  stock_holdings DECIMAL,
  political_donations DECIMAL,
  nonprofit_board_count INTEGER DEFAULT 0,
  employer TEXT,
  job_title TEXT,

  -- Scoring metrics (0-100)
  capacity_score INTEGER CHECK (capacity_score >= 0 AND capacity_score <= 100),
  affinity_score INTEGER CHECK (affinity_score >= 0 AND affinity_score <= 100),
  propensity_score INTEGER CHECK (propensity_score >= 0 AND propensity_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Analysis metrics
  giving_gap_ratio DECIMAL,
  data_sources JSONB DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  last_enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(contact_id)
);

-- Create indexes for performance
CREATE INDEX idx_giving_potential_contact_id ON giving_potential(contact_id);
CREATE INDEX idx_giving_potential_organization_id ON giving_potential(organization_id);
CREATE INDEX idx_giving_potential_overall_score ON giving_potential(overall_score DESC);
CREATE INDEX idx_giving_potential_capacity_score ON giving_potential(capacity_score DESC);

-- Enable RLS
ALTER TABLE giving_potential ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see giving_potential for contacts in their organization
CREATE POLICY "Users can view giving potential in their organization"
  ON giving_potential
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert giving_potential for contacts in their organization
CREATE POLICY "Users can insert giving potential in their organization"
  ON giving_potential
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update giving_potential for contacts in their organization
CREATE POLICY "Users can update giving potential in their organization"
  ON giving_potential
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete giving_potential for contacts in their organization
CREATE POLICY "Users can delete giving potential in their organization"
  ON giving_potential
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_giving_potential_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_giving_potential_updated_at
  BEFORE UPDATE ON giving_potential
  FOR EACH ROW
  EXECUTE FUNCTION update_giving_potential_updated_at();

-- Add helpful comments
COMMENT ON TABLE giving_potential IS 'Wealth screening and major gift prospect identification data for contacts';
COMMENT ON COLUMN giving_potential.capacity_score IS 'Estimated financial capacity to give (0-100)';
COMMENT ON COLUMN giving_potential.affinity_score IS 'Level of engagement and connection with the organization (0-100)';
COMMENT ON COLUMN giving_potential.propensity_score IS 'Likelihood to give based on giving history and patterns (0-100)';
COMMENT ON COLUMN giving_potential.overall_score IS 'Composite score combining capacity, affinity, and propensity (0-100)';
COMMENT ON COLUMN giving_potential.giving_gap_ratio IS 'Ratio of current giving to estimated capacity (lower = more potential)';
COMMENT ON COLUMN giving_potential.data_sources IS 'JSON object tracking which data sources contributed to the wealth screening';
