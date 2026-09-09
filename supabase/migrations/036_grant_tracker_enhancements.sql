-- Grant Tracker Enhancements Migration
-- Adds funders table and additional fields to grant_applications table

-- ============================================================================
-- FUNDERS TABLE
-- Manage funder/foundation database with contact info and notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS funders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Funder details
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('foundation', 'corporate', 'government', 'individual', 'other')),
  website TEXT,

  -- Contact information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Additional info
  notes TEXT,
  focus_areas TEXT[], -- Array of focus areas (education, health, environment, etc.)
  geographic_focus TEXT[], -- Array of regions/states
  average_grant_size NUMERIC(12,2),
  total_awarded NUMERIC(12,2) DEFAULT 0, -- Total amount awarded from this funder

  -- Relationship tracking
  relationship_status TEXT DEFAULT 'prospect' CHECK (relationship_status IN ('prospect', 'applied', 'active', 'past', 'declined')),
  last_contact_date DATE,

  -- Audit fields
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for funders
CREATE INDEX idx_funders_org_id ON funders(organization_id);
CREATE INDEX idx_funders_type ON funders(organization_id, type);
CREATE INDEX idx_funders_relationship ON funders(organization_id, relationship_status);
CREATE INDEX idx_funders_name ON funders(name);

-- Updated_at trigger
CREATE TRIGGER update_funders_updated_at
  BEFORE UPDATE ON funders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE funders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funders
CREATE POLICY "funders_all" ON funders
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- ENHANCE GRANT_APPLICATIONS TABLE
-- Add additional fields for better tracking
-- ============================================================================

-- Add program area and requirements fields if they don't exist
ALTER TABLE grant_applications
  ADD COLUMN IF NOT EXISTS program_area TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS funder_id UUID REFERENCES funders(id) ON DELETE SET NULL;

-- Create index for funder_id
CREATE INDEX IF NOT EXISTS idx_grant_applications_funder_id ON grant_applications(funder_id);

-- ============================================================================
-- UPDATE GRANT STATUS ENUM
-- Extend status enum to include 'researching' and 'writing' stages
-- ============================================================================

-- Drop existing check constraint
ALTER TABLE grant_applications DROP CONSTRAINT IF EXISTS grant_applications_status_check;

-- Add new check constraint with extended statuses
ALTER TABLE grant_applications ADD CONSTRAINT grant_applications_status_check
  CHECK (status IN ('researching', 'writing', 'draft', 'submitted', 'pending', 'approved', 'declined', 'reporting'));

-- ============================================================================
-- GRANT STATISTICS VIEW
-- Materialized view for grant analytics
-- ============================================================================

CREATE OR REPLACE VIEW grant_statistics AS
SELECT
  ga.organization_id,
  COUNT(*) FILTER (WHERE ga.status = 'researching') as researching_count,
  COUNT(*) FILTER (WHERE ga.status = 'writing') as writing_count,
  COUNT(*) FILTER (WHERE ga.status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE ga.status = 'submitted') as submitted_count,
  COUNT(*) FILTER (WHERE ga.status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE ga.status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE ga.status = 'declined') as declined_count,
  COUNT(*) FILTER (WHERE ga.status = 'reporting') as reporting_count,
  COUNT(*) as total_applications,
  SUM(ga.amount_requested) FILTER (WHERE ga.amount_requested IS NOT NULL) as total_requested,
  SUM(ga.amount_awarded) FILTER (WHERE ga.amount_awarded IS NOT NULL) as total_awarded,
  COUNT(*) FILTER (WHERE ga.deadline IS NOT NULL AND ga.deadline >= CURRENT_DATE AND ga.deadline <= CURRENT_DATE + INTERVAL '14 days' AND ga.status IN ('researching', 'writing', 'draft')) as upcoming_deadlines_count,
  ROUND(
    CAST(COUNT(*) FILTER (WHERE ga.status = 'approved') AS NUMERIC) /
    NULLIF(COUNT(*) FILTER (WHERE ga.status IN ('approved', 'declined')), 0) * 100,
    1
  ) as success_rate
FROM grant_applications ga
GROUP BY ga.organization_id;

-- Grant RLS on view
GRANT SELECT ON grant_statistics TO authenticated;

-- ============================================================================
-- FUNCTION: Update Funder Total Awarded
-- Automatically update total_awarded when grants are approved
-- ============================================================================

CREATE OR REPLACE FUNCTION update_funder_total_awarded()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the funder's total_awarded
  IF NEW.funder_id IS NOT NULL AND NEW.amount_awarded IS NOT NULL THEN
    UPDATE funders
    SET total_awarded = (
      SELECT COALESCE(SUM(amount_awarded), 0)
      FROM grant_applications
      WHERE funder_id = NEW.funder_id
        AND amount_awarded IS NOT NULL
    )
    WHERE id = NEW.funder_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_funder_total_awarded
  AFTER INSERT OR UPDATE OF amount_awarded ON grant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_funder_total_awarded();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE funders IS 'Database of grant funders and foundations with contact information and relationship tracking';
COMMENT ON TABLE grant_applications IS 'Grant applications with extended tracking for full lifecycle from research to reporting';
COMMENT ON VIEW grant_statistics IS 'Pre-computed grant statistics by organization for analytics';
COMMENT ON COLUMN funders.focus_areas IS 'Array of focus areas this funder supports';
COMMENT ON COLUMN funders.geographic_focus IS 'Array of geographic regions this funder focuses on';
COMMENT ON COLUMN funders.relationship_status IS 'Current relationship status with this funder';
COMMENT ON COLUMN grant_applications.program_area IS 'Program area this grant supports';
COMMENT ON COLUMN grant_applications.requirements IS 'Specific requirements or restrictions for this grant';
