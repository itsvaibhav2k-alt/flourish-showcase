-- Major Gift Pipeline Tables
-- Creates tables for managing major gift prospects and cultivation moves

-- Table 1: Major Gift Prospects
CREATE TABLE major_gift_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('identification', 'qualification', 'cultivation', 'solicitation', 'stewardship')),
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  target_ask_amount DECIMAL,
  target_ask_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  predicted_gift_amount DECIMAL,
  recommended_ask_amount DECIMAL,
  optimal_ask_timing TEXT,
  next_move TEXT,
  next_move_date DATE,
  actual_gift_amount DECIMAL,
  outcome TEXT CHECK (outcome IN ('pending', 'won', 'lost', 'deferred')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id)
);

-- Table 2: Cultivation Moves
CREATE TABLE cultivation_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES major_gift_prospects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  move_type TEXT NOT NULL CHECK (move_type IN ('call', 'meeting', 'email', 'event', 'tour', 'lunch', 'gift', 'proposal', 'other')),
  move_date DATE NOT NULL,
  description TEXT,
  outcome TEXT,
  next_step TEXT,
  logged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for major_gift_prospects
CREATE INDEX idx_major_gift_prospects_organization_id ON major_gift_prospects(organization_id);
CREATE INDEX idx_major_gift_prospects_contact_id ON major_gift_prospects(contact_id);
CREATE INDEX idx_major_gift_prospects_stage ON major_gift_prospects(stage);
CREATE INDEX idx_major_gift_prospects_assigned_to ON major_gift_prospects(assigned_to);
CREATE INDEX idx_major_gift_prospects_readiness_score ON major_gift_prospects(readiness_score);

-- Indexes for cultivation_moves
CREATE INDEX idx_cultivation_moves_prospect_id ON cultivation_moves(prospect_id);
CREATE INDEX idx_cultivation_moves_organization_id ON cultivation_moves(organization_id);
CREATE INDEX idx_cultivation_moves_move_date ON cultivation_moves(move_date);

-- Enable Row Level Security
ALTER TABLE major_gift_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for major_gift_prospects
CREATE POLICY "Users can view prospects in their organization"
  ON major_gift_prospects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prospects in their organization"
  ON major_gift_prospects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update prospects in their organization"
  ON major_gift_prospects
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete prospects in their organization"
  ON major_gift_prospects
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for cultivation_moves
CREATE POLICY "Users can view cultivation moves in their organization"
  ON cultivation_moves
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cultivation moves in their organization"
  ON cultivation_moves
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cultivation moves in their organization"
  ON cultivation_moves
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cultivation moves in their organization"
  ON cultivation_moves
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on major_gift_prospects
CREATE OR REPLACE FUNCTION update_major_gift_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_major_gift_prospects_updated_at
  BEFORE UPDATE ON major_gift_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_major_gift_prospects_updated_at();
