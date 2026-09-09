-- Grant Writing Assistant Migration
-- Adds grant_proposals table for AI-generated grant proposals

-- Create grant_proposals table
CREATE TABLE IF NOT EXISTS grant_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,

  -- Proposal metadata
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),

  -- Proposal sections (JSONB for flexibility)
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- sections structure:
  -- {
  --   "executive_summary": { "content": "...", "word_count": 150 },
  --   "statement_of_need": { "content": "...", "word_count": 500 },
  --   "project_description": { "content": "...", "word_count": 800 },
  --   "goals_and_objectives": { "content": "...", "word_count": 400 },
  --   "methods": { "content": "...", "word_count": 600 },
  --   "evaluation": { "content": "...", "word_count": 400 },
  --   "budget_narrative": { "content": "...", "word_count": 300 },
  --   "organizational_capacity": { "content": "...", "word_count": 400 }
  -- }

  -- AI metadata
  ai_model TEXT,
  ai_tokens_used INTEGER,
  ai_cost_usd DECIMAL(10, 6),

  -- Context used for generation
  org_context_snapshot JSONB,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_grant_proposals_organization_id ON grant_proposals(organization_id);
CREATE INDEX idx_grant_proposals_grant_id ON grant_proposals(grant_id);
CREATE INDEX idx_grant_proposals_status ON grant_proposals(status);
CREATE INDEX idx_grant_proposals_created_at ON grant_proposals(created_at DESC);

-- Enable RLS
ALTER TABLE grant_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view proposals for their organization"
  ON grant_proposals FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert proposals for their organization"
  ON grant_proposals FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update proposals for their organization"
  ON grant_proposals FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete proposals for their organization"
  ON grant_proposals FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Update timestamp trigger
CREATE TRIGGER set_grant_proposals_updated_at
  BEFORE UPDATE ON grant_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE grant_proposals IS 'AI-generated grant proposals linked to grant applications';
COMMENT ON COLUMN grant_proposals.sections IS 'JSONB object containing all proposal sections with content and word counts';
COMMENT ON COLUMN grant_proposals.org_context_snapshot IS 'Snapshot of organization context used for AI generation (impact metrics, donor stats, etc.)';
COMMENT ON COLUMN grant_proposals.version IS 'Version number for tracking proposal iterations';
