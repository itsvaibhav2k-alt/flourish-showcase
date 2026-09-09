-- Fix user_org_ids() function performance
-- The function uses auth.uid() which can cause per-row re-evaluation
-- Replace with (select auth.uid()) pattern

CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = (select auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- EMAIL_DRAFTS - Consolidate into single FOR ALL policy
-- ============================================================================
DROP POLICY IF EXISTS email_drafts_select_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_insert_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_update_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_delete_policy ON email_drafts;

CREATE POLICY "email_drafts_all" ON email_drafts
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- CONTACTS - Consolidate into single FOR ALL policy (heavily queried table)
-- ============================================================================
DROP POLICY IF EXISTS contacts_select_policy ON contacts;
DROP POLICY IF EXISTS contacts_insert_policy ON contacts;
DROP POLICY IF EXISTS contacts_update_policy ON contacts;
DROP POLICY IF EXISTS contacts_delete_policy ON contacts;

CREATE POLICY "contacts_all" ON contacts
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- GIFTS - Consolidate into single FOR ALL policy
-- ============================================================================
DROP POLICY IF EXISTS gifts_select_policy ON gifts;
DROP POLICY IF EXISTS gifts_insert_policy ON gifts;
DROP POLICY IF EXISTS gifts_update_policy ON gifts;
DROP POLICY IF EXISTS gifts_delete_policy ON gifts;

CREATE POLICY "gifts_all" ON gifts
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- ACTIVITIES - Consolidate into single FOR ALL policy
-- ============================================================================
DROP POLICY IF EXISTS activities_select_policy ON activities;
DROP POLICY IF EXISTS activities_insert_policy ON activities;
DROP POLICY IF EXISTS activities_update_policy ON activities;
DROP POLICY IF EXISTS activities_delete_policy ON activities;

CREATE POLICY "activities_all" ON activities
  FOR ALL USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- ORGANIZATIONS - Fix policy
-- ============================================================================
DROP POLICY IF EXISTS organizations_select_policy ON organizations;
DROP POLICY IF EXISTS organizations_update_policy ON organizations;

CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT user_org_ids())
  );

CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- Add index on email_drafts for faster status filtering
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_email_drafts_org_status
  ON email_drafts(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_email_drafts_org_created
  ON email_drafts(organization_id, created_at DESC);
