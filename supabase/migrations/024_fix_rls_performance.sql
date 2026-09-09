-- Fix RLS Performance Issues
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- Remove duplicate policies

-- ============================================================================
-- ORGANIZATION_MEMBERS - Critical table, queried on every page load
-- ============================================================================
DROP POLICY IF EXISTS "organization_members_select_policy" ON organization_members;
CREATE POLICY "organization_members_select_policy" ON organization_members
  FOR SELECT USING (user_id = (select auth.uid()));

-- ============================================================================
-- AI_USAGE - Remove duplicates and fix performance
-- ============================================================================
DROP POLICY IF EXISTS "Users can view usage in their organization" ON ai_usage;
DROP POLICY IF EXISTS "ai_usage_select_policy" ON ai_usage;
DROP POLICY IF EXISTS "Service role can insert usage" ON ai_usage;
DROP POLICY IF EXISTS "ai_usage_insert_policy" ON ai_usage;

CREATE POLICY "ai_usage_select" ON ai_usage
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "ai_usage_insert" ON ai_usage
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- ACTION_DISMISSALS
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their org's dismissals" ON action_dismissals;
CREATE POLICY "action_dismissals_all" ON action_dismissals
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SAVED_SEGMENTS - Remove duplicates and fix performance
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their org's segments" ON saved_segments;
DROP POLICY IF EXISTS "saved_segments_select_policy" ON saved_segments;
DROP POLICY IF EXISTS "saved_segments_insert_policy" ON saved_segments;
DROP POLICY IF EXISTS "saved_segments_update_policy" ON saved_segments;
DROP POLICY IF EXISTS "saved_segments_delete_policy" ON saved_segments;

CREATE POLICY "saved_segments_all" ON saved_segments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- CONTACT_NOTES
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their org's notes" ON contact_notes;
CREATE POLICY "contact_notes_all" ON contact_notes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- CONTACT_TASKS
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their org's tasks" ON contact_tasks;
CREATE POLICY "contact_tasks_all" ON contact_tasks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- COPILOT_ACTIONS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view organization copilot actions" ON copilot_actions;
DROP POLICY IF EXISTS "Users can update organization copilot actions" ON copilot_actions;
DROP POLICY IF EXISTS "Admins can delete copilot actions" ON copilot_actions;

CREATE POLICY "copilot_actions_all" ON copilot_actions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- GIVING_POTENTIAL
-- ============================================================================
DROP POLICY IF EXISTS "Users can view giving potential in their organization" ON giving_potential;
DROP POLICY IF EXISTS "Users can insert giving potential in their organization" ON giving_potential;
DROP POLICY IF EXISTS "Users can update giving potential in their organization" ON giving_potential;
DROP POLICY IF EXISTS "Users can delete giving potential in their organization" ON giving_potential;

CREATE POLICY "giving_potential_all" ON giving_potential
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- MAJOR_GIFT_PROSPECTS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view prospects in their organization" ON major_gift_prospects;
DROP POLICY IF EXISTS "Users can create prospects in their organization" ON major_gift_prospects;
DROP POLICY IF EXISTS "Users can update prospects in their organization" ON major_gift_prospects;
DROP POLICY IF EXISTS "Users can delete prospects in their organization" ON major_gift_prospects;

CREATE POLICY "major_gift_prospects_all" ON major_gift_prospects
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- CULTIVATION_MOVES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view cultivation moves in their organization" ON cultivation_moves;
DROP POLICY IF EXISTS "Users can create cultivation moves in their organization" ON cultivation_moves;
DROP POLICY IF EXISTS "Users can update cultivation moves in their organization" ON cultivation_moves;
DROP POLICY IF EXISTS "Users can delete cultivation moves in their organization" ON cultivation_moves;

CREATE POLICY "cultivation_moves_all" ON cultivation_moves
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PROGRAM_METRICS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view program metrics for their organization" ON program_metrics;
DROP POLICY IF EXISTS "Users can insert program metrics for their organization" ON program_metrics;
DROP POLICY IF EXISTS "Users can update program metrics for their organization" ON program_metrics;
DROP POLICY IF EXISTS "Users can delete program metrics for their organization" ON program_metrics;

CREATE POLICY "program_metrics_all" ON program_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- IMPACT_STORIES - Keep public access policy, fix org policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view impact stories for their organization" ON impact_stories;
DROP POLICY IF EXISTS "Users can insert impact stories for their organization" ON impact_stories;
DROP POLICY IF EXISTS "Users can update impact stories for their organization" ON impact_stories;
DROP POLICY IF EXISTS "Users can delete impact stories for their organization" ON impact_stories;

CREATE POLICY "impact_stories_org_all" ON impact_stories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- USERS table
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = (select auth.uid()));
