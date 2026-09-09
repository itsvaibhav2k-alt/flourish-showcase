-- Migration 007: Saved Segments
-- User-defined contact/donor/volunteer segments with filter criteria

CREATE TABLE IF NOT EXISTS saved_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('CONTACT', 'DONOR', 'VOLUNTEER')),
  filters jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_segments_org ON saved_segments(organization_id);

ALTER TABLE saved_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org's segments" ON saved_segments
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
