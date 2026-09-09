-- Migration 006: Action Rules
-- Add birthday field to contacts and action dismissals table

-- Add birthday field to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add action dismissals table for "Today's Actions" widget
CREATE TABLE IF NOT EXISTS action_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  dismissed_at timestamptz DEFAULT now(),
  dismissed_by uuid REFERENCES auth.users(id),
  UNIQUE(organization_id, action_key)
);

-- RLS for action_dismissals
ALTER TABLE action_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org's dismissals" ON action_dismissals
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
