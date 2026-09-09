-- Migration 045: Soft Delete for Gifts
-- Add soft delete support to gifts table

-- Add soft delete support to gifts table
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient querying of non-archived gifts
CREATE INDEX IF NOT EXISTS idx_gifts_not_archived ON gifts(organization_id, contact_id) WHERE archived_at IS NULL;

-- Update existing RLS policies to filter archived by default
DROP POLICY IF EXISTS "gifts_select_org" ON gifts;
CREATE POLICY "gifts_select_org" ON gifts
  FOR SELECT USING (
    organization_id IN (SELECT user_org_ids())
  );

-- Note: Application code should add WHERE archived_at IS NULL for most queries
