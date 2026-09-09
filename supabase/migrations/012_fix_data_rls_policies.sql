-- Fix RLS policies for data tables (contacts, gifts, shifts, etc.)
-- The previous policies used get_current_organization_id() which requires JWT claims or headers
-- This migration changes them to use auth.uid() and organization_members lookup

-- Create a helper function to get organization IDs for the current user
-- This uses SECURITY DEFINER to avoid recursion issues
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- CONTACTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS contacts_select_policy ON contacts;
DROP POLICY IF EXISTS contacts_insert_policy ON contacts;
DROP POLICY IF EXISTS contacts_update_policy ON contacts;
DROP POLICY IF EXISTS contacts_delete_policy ON contacts;

CREATE POLICY contacts_select_policy ON contacts
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY contacts_insert_policy ON contacts
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY contacts_update_policy ON contacts
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY contacts_delete_policy ON contacts
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));

-- ============================================================================
-- GIFTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS gifts_select_policy ON gifts;
DROP POLICY IF EXISTS gifts_insert_policy ON gifts;
DROP POLICY IF EXISTS gifts_update_policy ON gifts;
DROP POLICY IF EXISTS gifts_delete_policy ON gifts;

CREATE POLICY gifts_select_policy ON gifts
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY gifts_insert_policy ON gifts
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY gifts_update_policy ON gifts
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY gifts_delete_policy ON gifts
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));

-- ============================================================================
-- SHIFTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS shifts_select_policy ON shifts;
DROP POLICY IF EXISTS shifts_insert_policy ON shifts;
DROP POLICY IF EXISTS shifts_update_policy ON shifts;
DROP POLICY IF EXISTS shifts_delete_policy ON shifts;

CREATE POLICY shifts_select_policy ON shifts
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY shifts_insert_policy ON shifts
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY shifts_update_policy ON shifts
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY shifts_delete_policy ON shifts
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));

-- ============================================================================
-- SHIFT_SIGNUPS POLICIES (depends on shifts)
-- ============================================================================
DROP POLICY IF EXISTS shift_signups_select_policy ON shift_signups;
DROP POLICY IF EXISTS shift_signups_insert_policy ON shift_signups;
DROP POLICY IF EXISTS shift_signups_update_policy ON shift_signups;
DROP POLICY IF EXISTS shift_signups_delete_policy ON shift_signups;

CREATE POLICY shift_signups_select_policy ON shift_signups
    FOR SELECT
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())
        )
    );

CREATE POLICY shift_signups_insert_policy ON shift_signups
    FOR INSERT
    WITH CHECK (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())
        )
    );

CREATE POLICY shift_signups_update_policy ON shift_signups
    FOR UPDATE
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())
        )
    );

CREATE POLICY shift_signups_delete_policy ON shift_signups
    FOR DELETE
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())
        )
    );

-- ============================================================================
-- EMAIL_DRAFTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS email_drafts_select_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_insert_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_update_policy ON email_drafts;
DROP POLICY IF EXISTS email_drafts_delete_policy ON email_drafts;

CREATE POLICY email_drafts_select_policy ON email_drafts
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY email_drafts_insert_policy ON email_drafts
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY email_drafts_update_policy ON email_drafts
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY email_drafts_delete_policy ON email_drafts
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS activities_select_policy ON activities;
DROP POLICY IF EXISTS activities_insert_policy ON activities;
DROP POLICY IF EXISTS activities_update_policy ON activities;
DROP POLICY IF EXISTS activities_delete_policy ON activities;

CREATE POLICY activities_select_policy ON activities
    FOR SELECT
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY activities_insert_policy ON activities
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY activities_update_policy ON activities
    FOR UPDATE
    USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY activities_delete_policy ON activities
    FOR DELETE
    USING (organization_id IN (SELECT user_org_ids()));

-- ============================================================================
-- VOICE_PROFILES POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'voice_profiles') THEN
        DROP POLICY IF EXISTS voice_profiles_select_policy ON voice_profiles;
        DROP POLICY IF EXISTS voice_profiles_insert_policy ON voice_profiles;
        DROP POLICY IF EXISTS voice_profiles_update_policy ON voice_profiles;
        DROP POLICY IF EXISTS voice_profiles_delete_policy ON voice_profiles;

        EXECUTE 'CREATE POLICY voice_profiles_select_policy ON voice_profiles FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY voice_profiles_insert_policy ON voice_profiles FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY voice_profiles_update_policy ON voice_profiles FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY voice_profiles_delete_policy ON voice_profiles FOR DELETE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- AI_USAGE POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_usage') THEN
        DROP POLICY IF EXISTS ai_usage_select_policy ON ai_usage;
        DROP POLICY IF EXISTS ai_usage_insert_policy ON ai_usage;

        EXECUTE 'CREATE POLICY ai_usage_select_policy ON ai_usage FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY ai_usage_insert_policy ON ai_usage FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- NOTES POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notes') THEN
        DROP POLICY IF EXISTS notes_select_policy ON notes;
        DROP POLICY IF EXISTS notes_insert_policy ON notes;
        DROP POLICY IF EXISTS notes_update_policy ON notes;
        DROP POLICY IF EXISTS notes_delete_policy ON notes;

        EXECUTE 'CREATE POLICY notes_select_policy ON notes FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY notes_insert_policy ON notes FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY notes_update_policy ON notes FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY notes_delete_policy ON notes FOR DELETE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- TASKS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tasks') THEN
        DROP POLICY IF EXISTS tasks_select_policy ON tasks;
        DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
        DROP POLICY IF EXISTS tasks_update_policy ON tasks;
        DROP POLICY IF EXISTS tasks_delete_policy ON tasks;

        EXECUTE 'CREATE POLICY tasks_select_policy ON tasks FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY tasks_insert_policy ON tasks FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY tasks_update_policy ON tasks FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY tasks_delete_policy ON tasks FOR DELETE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- ACTION_RULES POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'action_rules') THEN
        DROP POLICY IF EXISTS action_rules_select_policy ON action_rules;
        DROP POLICY IF EXISTS action_rules_insert_policy ON action_rules;
        DROP POLICY IF EXISTS action_rules_update_policy ON action_rules;
        DROP POLICY IF EXISTS action_rules_delete_policy ON action_rules;

        EXECUTE 'CREATE POLICY action_rules_select_policy ON action_rules FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY action_rules_insert_policy ON action_rules FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY action_rules_update_policy ON action_rules FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY action_rules_delete_policy ON action_rules FOR DELETE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- SAVED_SEGMENTS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saved_segments') THEN
        DROP POLICY IF EXISTS saved_segments_select_policy ON saved_segments;
        DROP POLICY IF EXISTS saved_segments_insert_policy ON saved_segments;
        DROP POLICY IF EXISTS saved_segments_update_policy ON saved_segments;
        DROP POLICY IF EXISTS saved_segments_delete_policy ON saved_segments;

        EXECUTE 'CREATE POLICY saved_segments_select_policy ON saved_segments FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY saved_segments_insert_policy ON saved_segments FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY saved_segments_update_policy ON saved_segments FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY saved_segments_delete_policy ON saved_segments FOR DELETE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;

-- ============================================================================
-- ORGANIZATION_SETTINGS POLICIES (if exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'organization_settings') THEN
        DROP POLICY IF EXISTS organization_settings_select_policy ON organization_settings;
        DROP POLICY IF EXISTS organization_settings_insert_policy ON organization_settings;
        DROP POLICY IF EXISTS organization_settings_update_policy ON organization_settings;

        EXECUTE 'CREATE POLICY organization_settings_select_policy ON organization_settings FOR SELECT USING (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY organization_settings_insert_policy ON organization_settings FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))';
        EXECUTE 'CREATE POLICY organization_settings_update_policy ON organization_settings FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))';
    END IF;
END $$;
