-- ============================================================================
-- TEAM ANALYTICS MODULE
-- ============================================================================
-- This migration adds user tracking fields and creates views for team analytics
-- Tracks team member activity across contacts, gifts, notes, and emails

-- Add created_by/recorded_by fields to track user actions
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gifts_recorded_by ON gifts(recorded_by) WHERE recorded_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_drafts_created_by ON email_drafts(created_by) WHERE created_by IS NOT NULL;
-- Only create notes index if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
    CREATE INDEX IF NOT EXISTS idx_notes_created_by ON contact_notes(created_by) WHERE created_by IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- TEAM ACTIVITY STATS VIEW
-- ============================================================================
-- Materialized view for team member activity metrics
-- Aggregates activities across multiple tables for the last 30 days

CREATE MATERIALIZED VIEW IF NOT EXISTS team_activity_stats AS
SELECT
  om.user_id,
  om.organization_id,
  om.role,
  om.created_at as member_since,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,

  -- Last 30 days activity counts
  (SELECT COUNT(*)
   FROM contacts c
   WHERE c.created_by = om.user_id
     AND c.organization_id = om.organization_id
     AND c.created_at > NOW() - INTERVAL '30 days'
  ) as contacts_added_30d,

  (SELECT COUNT(*)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
     AND g.created_at > NOW() - INTERVAL '30 days'
  ) as gifts_recorded_30d,

  (SELECT COALESCE(SUM(g.amount), 0)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
     AND g.created_at > NOW() - INTERVAL '30 days'
  ) as gift_amount_30d,

  (SELECT COUNT(*)
   FROM email_drafts ed
   WHERE ed.created_by = om.user_id
     AND ed.organization_id = om.organization_id
     AND ed.status = 'sent'
     AND ed.sent_at > NOW() - INTERVAL '30 days'
  ) as emails_sent_30d,

  (SELECT COUNT(*)
   FROM contact_notes n
   WHERE n.created_by = om.user_id
     AND n.organization_id = om.organization_id
     AND n.created_at > NOW() - INTERVAL '30 days'
  ) as notes_added_30d,

  -- Last 7 days activity counts
  (SELECT COUNT(*)
   FROM contacts c
   WHERE c.created_by = om.user_id
     AND c.organization_id = om.organization_id
     AND c.created_at > NOW() - INTERVAL '7 days'
  ) as contacts_added_7d,

  (SELECT COUNT(*)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
     AND g.created_at > NOW() - INTERVAL '7 days'
  ) as gifts_recorded_7d,

  (SELECT COUNT(*)
   FROM email_drafts ed
   WHERE ed.created_by = om.user_id
     AND ed.organization_id = om.organization_id
     AND ed.status = 'sent'
     AND ed.sent_at > NOW() - INTERVAL '7 days'
  ) as emails_sent_7d,

  (SELECT COUNT(*)
   FROM contact_notes n
   WHERE n.created_by = om.user_id
     AND n.organization_id = om.organization_id
     AND n.created_at > NOW() - INTERVAL '7 days'
  ) as notes_added_7d,

  -- Last 90 days activity counts
  (SELECT COUNT(*)
   FROM contacts c
   WHERE c.created_by = om.user_id
     AND c.organization_id = om.organization_id
     AND c.created_at > NOW() - INTERVAL '90 days'
  ) as contacts_added_90d,

  (SELECT COUNT(*)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
     AND g.created_at > NOW() - INTERVAL '90 days'
  ) as gifts_recorded_90d,

  (SELECT COUNT(*)
   FROM email_drafts ed
   WHERE ed.created_by = om.user_id
     AND ed.organization_id = om.organization_id
     AND ed.status = 'sent'
     AND ed.sent_at > NOW() - INTERVAL '90 days'
  ) as emails_sent_90d,

  (SELECT COUNT(*)
   FROM contact_notes n
   WHERE n.created_by = om.user_id
     AND n.organization_id = om.organization_id
     AND n.created_at > NOW() - INTERVAL '90 days'
  ) as notes_added_90d,

  -- All time counts
  (SELECT COUNT(*)
   FROM contacts c
   WHERE c.created_by = om.user_id
     AND c.organization_id = om.organization_id
  ) as contacts_added_all,

  (SELECT COUNT(*)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
  ) as gifts_recorded_all,

  (SELECT COALESCE(SUM(g.amount), 0)
   FROM gifts g
   WHERE g.recorded_by = om.user_id
     AND g.organization_id = om.organization_id
  ) as gift_amount_all,

  (SELECT COUNT(*)
   FROM email_drafts ed
   WHERE ed.created_by = om.user_id
     AND ed.organization_id = om.organization_id
     AND ed.status = 'sent'
  ) as emails_sent_all,

  (SELECT COUNT(*)
   FROM contact_notes n
   WHERE n.created_by = om.user_id
     AND n.organization_id = om.organization_id
  ) as notes_added_all,

  NOW() as last_refreshed

FROM organization_members om
JOIN auth.users u ON om.user_id = u.id;

-- Create index on materialized view for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_activity_stats_user_org
  ON team_activity_stats(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_team_activity_stats_org
  ON team_activity_stats(organization_id);

-- ============================================================================
-- REFRESH FUNCTION
-- ============================================================================
-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_team_activity_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY team_activity_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_team_activity_stats() TO authenticated;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Enable RLS on the materialized view (requires treating it as a table)
ALTER MATERIALIZED VIEW team_activity_stats OWNER TO postgres;

-- Note: Materialized views don't support RLS directly, but we can control
-- access through the queries that read from them

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON MATERIALIZED VIEW team_activity_stats IS
  'Aggregated team member activity statistics across multiple time periods.
   Refresh this view periodically (e.g., hourly) for up-to-date metrics.';

COMMENT ON COLUMN team_activity_stats.contacts_added_30d IS 'Number of contacts added by this user in the last 30 days';
COMMENT ON COLUMN team_activity_stats.gifts_recorded_30d IS 'Number of gifts recorded by this user in the last 30 days';
COMMENT ON COLUMN team_activity_stats.gift_amount_30d IS 'Total amount of gifts recorded by this user in the last 30 days';
COMMENT ON COLUMN team_activity_stats.emails_sent_30d IS 'Number of emails sent by this user in the last 30 days';
COMMENT ON COLUMN team_activity_stats.notes_added_30d IS 'Number of notes added by this user in the last 30 days';
