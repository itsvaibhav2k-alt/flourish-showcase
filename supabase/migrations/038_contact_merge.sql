-- Migration 038: Contact Merge Tracking
-- Adds merged_into_id column to track contact merges

-- Add merged_into_id column to contacts table
ALTER TABLE contacts ADD COLUMN merged_into_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Index for finding merged contacts
CREATE INDEX idx_contacts_merged_into ON contacts(merged_into_id) WHERE merged_into_id IS NOT NULL;

-- Function to merge two contacts
-- This will move all related records from source to target contact
CREATE OR REPLACE FUNCTION merge_contacts(
  source_contact_id UUID,
  target_contact_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  source_contact RECORD;
  target_contact RECORD;
BEGIN
  -- Verify both contacts exist and belong to the same organization
  SELECT * INTO source_contact FROM contacts
  WHERE id = source_contact_id AND organization_id = p_organization_id AND archived_at IS NULL;

  SELECT * INTO target_contact FROM contacts
  WHERE id = target_contact_id AND organization_id = p_organization_id AND archived_at IS NULL;

  IF source_contact IS NULL OR target_contact IS NULL THEN
    RAISE EXCEPTION 'One or both contacts not found or already archived';
  END IF;

  IF source_contact_id = target_contact_id THEN
    RAISE EXCEPTION 'Cannot merge a contact with itself';
  END IF;

  -- Move all gifts to target contact
  UPDATE gifts
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id;

  -- Move all activities to target contact
  UPDATE activities
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id;

  -- Move all shift signups to target contact
  UPDATE shift_signups
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id
  AND NOT EXISTS (
    SELECT 1 FROM shift_signups
    WHERE contact_id = target_contact_id
    AND shift_id = shift_signups.shift_id
  );

  -- Move all email drafts to target contact
  UPDATE email_drafts
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id;

  -- Move all notes to target contact
  UPDATE notes
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id;

  -- Move all tasks to target contact
  UPDATE tasks
  SET contact_id = target_contact_id
  WHERE contact_id = source_contact_id;

  -- Merge tags (combine unique tags)
  UPDATE contacts
  SET tags = (
    SELECT ARRAY_AGG(DISTINCT tag)
    FROM (
      SELECT UNNEST(source_contact.tags) AS tag
      UNION
      SELECT UNNEST(target_contact.tags) AS tag
    ) t
    WHERE tag IS NOT NULL
  )
  WHERE id = target_contact_id;

  -- Archive source contact and record merge
  UPDATE contacts
  SET
    archived_at = NOW(),
    merged_into_id = target_contact_id
  WHERE id = source_contact_id;

  -- Recalculate target contact stats (trigger will handle gifts, need manual for volunteers)
  UPDATE contacts
  SET
    is_donor = COALESCE(source_contact.is_donor, FALSE) OR COALESCE(target_contact.is_donor, FALSE),
    is_volunteer = COALESCE(source_contact.is_volunteer, FALSE) OR COALESCE(target_contact.is_volunteer, FALSE)
  WHERE id = target_contact_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
