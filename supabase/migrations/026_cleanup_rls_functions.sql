-- Cleanup RLS Functions and Policies
-- Consolidate all org membership checks to use a single optimized function

-- Drop the old function if it exists (from migration 011)
DROP FUNCTION IF EXISTS user_organization_ids();

-- Recreate user_org_ids with proper caching
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
DECLARE
  uid UUID;
BEGIN
  -- Cache the auth.uid() call
  uid := (SELECT auth.uid());

  -- Return empty set if not authenticated
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT organization_id
  FROM organization_members
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_org_ids() TO anon;
