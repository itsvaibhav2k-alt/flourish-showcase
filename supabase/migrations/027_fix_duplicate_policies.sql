-- Fix duplicate permissive policies causing performance issues

-- ============================================================================
-- COPILOT_ACTIONS - Remove duplicate INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Service role can insert copilot actions" ON copilot_actions;

-- ============================================================================
-- IMPACT_STORIES - Consolidate into single policies per action
-- ============================================================================
DROP POLICY IF EXISTS "Public can view impact stories via share token" ON impact_stories;
DROP POLICY IF EXISTS "impact_stories_org_all" ON impact_stories;

-- SELECT: public via token OR org member
CREATE POLICY "impact_stories_select" ON impact_stories
  FOR SELECT USING (
    share_token IS NOT NULL
    OR organization_id IN (SELECT user_org_ids())
  );

-- INSERT: org members only
CREATE POLICY "impact_stories_insert" ON impact_stories
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT user_org_ids())
  );

-- UPDATE: org members only
CREATE POLICY "impact_stories_update" ON impact_stories
  FOR UPDATE USING (
    organization_id IN (SELECT user_org_ids())
  );

-- DELETE: org members only
CREATE POLICY "impact_stories_delete" ON impact_stories
  FOR DELETE USING (
    organization_id IN (SELECT user_org_ids())
  );
