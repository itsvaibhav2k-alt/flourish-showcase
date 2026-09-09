-- Migration 046: Optimistic Locking
-- Add version column for concurrent edit detection

-- Add version column to contacts for optimistic locking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_contact_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_version_trigger ON contacts;
CREATE TRIGGER contacts_version_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION increment_contact_version();

-- Add version to gifts as well
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE OR REPLACE FUNCTION increment_gift_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gifts_version_trigger ON gifts;
CREATE TRIGGER gifts_version_trigger
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION increment_gift_version();
