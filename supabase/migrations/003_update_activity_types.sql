-- Update activity_type constraint to support all activity types
-- Migration to expand the list of allowed activity types in the activities table

-- Drop the existing constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

-- Add new constraint with expanded activity types
ALTER TABLE activities ADD CONSTRAINT activities_activity_type_check
  CHECK (activity_type IN (
    'gift_recorded',
    'gift_updated',
    'gift_deleted',
    'contact_created',
    'contact_updated',
    'volunteer_signup',
    'volunteer_checkin',
    'volunteer_no_show',
    'volunteer_cancelled',
    'shift_created',
    'shift_updated',
    'email_sent',
    'email_draft_created',
    'note_added',
    'other',
    -- Legacy types for backward compatibility
    'gift',
    'shift_signup',
    'shift_completed'
  ));

-- Rename occurred_at to created_at for consistency (if the column is occurred_at)
-- Note: This will be a no-op if the column is already named created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'occurred_at'
  ) THEN
    -- Rename the column
    ALTER TABLE activities RENAME COLUMN occurred_at TO created_at;

    -- Drop the old index
    DROP INDEX IF EXISTS idx_activities_occurred_at;

    -- Create new index on created_at
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
  END IF;
END $$;

-- Make description NOT NULL if it isn't already
ALTER TABLE activities ALTER COLUMN description SET NOT NULL;

-- Add comments explaining the columns
COMMENT ON COLUMN activities.activity_type IS
  'Type of activity: gift_recorded, gift_updated, gift_deleted, contact_created, contact_updated, volunteer_signup, volunteer_checkin, volunteer_no_show, volunteer_cancelled, shift_created, shift_updated, email_sent, email_draft_created, note_added, or other';

COMMENT ON COLUMN activities.metadata IS
  'JSONB metadata storing additional context about the activity (e.g., amount, gift_id, shift_id, hours_logged, changes)';

COMMENT ON COLUMN activities.created_at IS
  'Timestamp when the activity was created (defaults to current time but can be set to a past date for historical records)';
