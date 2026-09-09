-- Migration 044: Transaction Helpers
-- Safe contact merge with full transaction support

-- Safe contact merge with full transaction support
CREATE OR REPLACE FUNCTION safe_merge_contacts(
  p_source_id UUID,
  p_target_id UUID,
  p_org_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_source_contact RECORD;
  v_target_contact RECORD;
BEGIN
  -- Verify source contact exists and belongs to org
  SELECT * INTO v_source_contact FROM contacts
  WHERE id = p_source_id AND organization_id = p_org_id AND archived_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source contact not found');
  END IF;

  -- Verify target contact exists and belongs to org
  SELECT * INTO v_target_contact FROM contacts
  WHERE id = p_target_id AND organization_id = p_org_id AND archived_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target contact not found');
  END IF;

  -- All operations in single transaction (implicit in function)
  -- Move gifts
  UPDATE gifts SET contact_id = p_target_id WHERE contact_id = p_source_id;

  -- Move activities
  UPDATE activities SET contact_id = p_target_id WHERE contact_id = p_source_id;

  -- Move shift signups (avoid duplicates)
  UPDATE shift_signups SET contact_id = p_target_id
  WHERE contact_id = p_source_id
  AND shift_id NOT IN (SELECT shift_id FROM shift_signups WHERE contact_id = p_target_id);

  -- Delete duplicate signups from source
  DELETE FROM shift_signups WHERE contact_id = p_source_id;

  -- Move email drafts
  UPDATE email_drafts SET contact_id = p_target_id WHERE contact_id = p_source_id;

  -- Move notes
  UPDATE notes SET contact_id = p_target_id WHERE contact_id = p_source_id;

  -- Move tasks
  UPDATE tasks SET contact_id = p_target_id WHERE contact_id = p_source_id;

  -- Move sequence enrollments (avoid duplicates)
  UPDATE sequence_enrollments SET contact_id = p_target_id
  WHERE contact_id = p_source_id
  AND sequence_id NOT IN (SELECT sequence_id FROM sequence_enrollments WHERE contact_id = p_target_id);
  DELETE FROM sequence_enrollments WHERE contact_id = p_source_id;

  -- Archive source contact with merge reference
  UPDATE contacts SET
    archived_at = NOW(),
    merged_into_id = p_target_id
  WHERE id = p_source_id;

  -- Log merge activity
  INSERT INTO activities (organization_id, contact_id, activity_type, description, metadata)
  VALUES (
    p_org_id,
    p_target_id,
    'contact_merged',
    'Contact merged from ' || v_source_contact.first_name || ' ' || v_source_contact.last_name,
    jsonb_build_object('source_contact_id', p_source_id, 'source_name', v_source_contact.first_name || ' ' || v_source_contact.last_name)
  );

  RETURN jsonb_build_object('success', true, 'merged_contact_id', p_target_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
