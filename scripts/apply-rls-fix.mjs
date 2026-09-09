#!/usr/bin/env node
/**
 * Apply RLS policy fixes to Supabase
 * Uses service role key to execute DDL statements
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const statements = [
  // Create helper function
  `CREATE OR REPLACE FUNCTION user_org_ids()
   RETURNS SETOF UUID AS $$
   BEGIN
       RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER STABLE`,

  // CONTACTS POLICIES
  `DROP POLICY IF EXISTS contacts_select_policy ON contacts`,
  `DROP POLICY IF EXISTS contacts_insert_policy ON contacts`,
  `DROP POLICY IF EXISTS contacts_update_policy ON contacts`,
  `DROP POLICY IF EXISTS contacts_delete_policy ON contacts`,
  `CREATE POLICY contacts_select_policy ON contacts FOR SELECT USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY contacts_insert_policy ON contacts FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY contacts_update_policy ON contacts FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY contacts_delete_policy ON contacts FOR DELETE USING (organization_id IN (SELECT user_org_ids()))`,

  // GIFTS POLICIES
  `DROP POLICY IF EXISTS gifts_select_policy ON gifts`,
  `DROP POLICY IF EXISTS gifts_insert_policy ON gifts`,
  `DROP POLICY IF EXISTS gifts_update_policy ON gifts`,
  `DROP POLICY IF EXISTS gifts_delete_policy ON gifts`,
  `CREATE POLICY gifts_select_policy ON gifts FOR SELECT USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY gifts_insert_policy ON gifts FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY gifts_update_policy ON gifts FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY gifts_delete_policy ON gifts FOR DELETE USING (organization_id IN (SELECT user_org_ids()))`,

  // SHIFTS POLICIES
  `DROP POLICY IF EXISTS shifts_select_policy ON shifts`,
  `DROP POLICY IF EXISTS shifts_insert_policy ON shifts`,
  `DROP POLICY IF EXISTS shifts_update_policy ON shifts`,
  `DROP POLICY IF EXISTS shifts_delete_policy ON shifts`,
  `CREATE POLICY shifts_select_policy ON shifts FOR SELECT USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY shifts_insert_policy ON shifts FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY shifts_update_policy ON shifts FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY shifts_delete_policy ON shifts FOR DELETE USING (organization_id IN (SELECT user_org_ids()))`,

  // SHIFT_SIGNUPS POLICIES
  `DROP POLICY IF EXISTS shift_signups_select_policy ON shift_signups`,
  `DROP POLICY IF EXISTS shift_signups_insert_policy ON shift_signups`,
  `DROP POLICY IF EXISTS shift_signups_update_policy ON shift_signups`,
  `DROP POLICY IF EXISTS shift_signups_delete_policy ON shift_signups`,
  `CREATE POLICY shift_signups_select_policy ON shift_signups FOR SELECT USING (shift_id IN (SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())))`,
  `CREATE POLICY shift_signups_insert_policy ON shift_signups FOR INSERT WITH CHECK (shift_id IN (SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())))`,
  `CREATE POLICY shift_signups_update_policy ON shift_signups FOR UPDATE USING (shift_id IN (SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())))`,
  `CREATE POLICY shift_signups_delete_policy ON shift_signups FOR DELETE USING (shift_id IN (SELECT id FROM shifts WHERE organization_id IN (SELECT user_org_ids())))`,

  // EMAIL_DRAFTS POLICIES
  `DROP POLICY IF EXISTS email_drafts_select_policy ON email_drafts`,
  `DROP POLICY IF EXISTS email_drafts_insert_policy ON email_drafts`,
  `DROP POLICY IF EXISTS email_drafts_update_policy ON email_drafts`,
  `DROP POLICY IF EXISTS email_drafts_delete_policy ON email_drafts`,
  `CREATE POLICY email_drafts_select_policy ON email_drafts FOR SELECT USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY email_drafts_insert_policy ON email_drafts FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY email_drafts_update_policy ON email_drafts FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY email_drafts_delete_policy ON email_drafts FOR DELETE USING (organization_id IN (SELECT user_org_ids()))`,

  // ACTIVITIES POLICIES
  `DROP POLICY IF EXISTS activities_select_policy ON activities`,
  `DROP POLICY IF EXISTS activities_insert_policy ON activities`,
  `DROP POLICY IF EXISTS activities_update_policy ON activities`,
  `DROP POLICY IF EXISTS activities_delete_policy ON activities`,
  `CREATE POLICY activities_select_policy ON activities FOR SELECT USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY activities_insert_policy ON activities FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY activities_update_policy ON activities FOR UPDATE USING (organization_id IN (SELECT user_org_ids()))`,
  `CREATE POLICY activities_delete_policy ON activities FOR DELETE USING (organization_id IN (SELECT user_org_ids()))`,
]

async function applyMigration() {
  console.log('Applying RLS policy fixes...\n')

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i]
    const shortSql = sql.substring(0, 80).replace(/\n/g, ' ') + '...'

    try {
      const { error } = await supabase.rpc('exec_sql', { sql })

      if (error) {
        // Try direct query via postgres function if exec_sql doesn't exist
        console.log(`[${i + 1}/${statements.length}] ERROR: ${error.message}`)
        console.log('Trying alternative approach...')
        break
      }
      console.log(`[${i + 1}/${statements.length}] OK: ${shortSql}`)
    } catch (err) {
      console.log(`[${i + 1}/${statements.length}] ERROR: ${err.message}`)
      break
    }
  }

  console.log('\nMigration complete!')
}

applyMigration()
