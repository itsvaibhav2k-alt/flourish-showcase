-- Donors Module Database Migration
-- This file contains the SQL needed to set up the donors module tables

-- 1. Add is_donor column to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS is_donor BOOLEAN DEFAULT FALSE;

-- Create index for faster donor queries
CREATE INDEX IF NOT EXISTS idx_contacts_is_donor
ON contacts(organization_id, is_donor)
WHERE is_donor = TRUE;

-- 2. Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  gift_date DATE NOT NULL,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('one_time', 'recurring', 'pledge', 'in_kind')),
  campaign TEXT,
  payment_method TEXT,
  notes TEXT,
  thanked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gifts_contact_id ON gifts(contact_id);
CREATE INDEX IF NOT EXISTS idx_gifts_organization_id ON gifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_gifts_gift_date ON gifts(gift_date DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_org_date ON gifts(organization_id, gift_date DESC);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access gifts for their organization
CREATE POLICY "Users can view gifts from their organization"
ON gifts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert gifts for their organization
CREATE POLICY "Users can insert gifts for their organization"
ON gifts
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update gifts from their organization
CREATE POLICY "Users can update gifts from their organization"
ON gifts
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete gifts from their organization
CREATE POLICY "Users can delete gifts from their organization"
ON gifts
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- 4. Create a function to automatically update is_donor flag
CREATE OR REPLACE FUNCTION update_contact_is_donor()
RETURNS TRIGGER AS $$
BEGIN
  -- When a gift is inserted, set is_donor to true
  IF (TG_OP = 'INSERT') THEN
    UPDATE contacts
    SET is_donor = TRUE
    WHERE id = NEW.contact_id;
  END IF;

  -- When a gift is deleted, check if contact still has gifts
  IF (TG_OP = 'DELETE') THEN
    UPDATE contacts
    SET is_donor = (
      SELECT COUNT(*) > 0
      FROM gifts
      WHERE contact_id = OLD.contact_id
    )
    WHERE id = OLD.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage is_donor flag
DROP TRIGGER IF EXISTS trigger_update_contact_is_donor ON gifts;
CREATE TRIGGER trigger_update_contact_is_donor
AFTER INSERT OR DELETE ON gifts
FOR EACH ROW
EXECUTE FUNCTION update_contact_is_donor();

-- 5. Create a database view for donor statistics (optional optimization)
CREATE OR REPLACE VIEW donor_statistics AS
SELECT
  c.id as contact_id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.email,
  COUNT(g.id) as gift_count,
  COALESCE(SUM(g.amount), 0) as lifetime_giving,
  COALESCE(AVG(g.amount), 0) as average_gift,
  MIN(g.gift_date) as first_gift_date,
  MAX(g.gift_date) as last_gift_date
FROM contacts c
LEFT JOIN gifts g ON c.id = g.contact_id
WHERE c.is_donor = TRUE
GROUP BY c.id, c.organization_id, c.first_name, c.last_name, c.email;

-- Grant access to the view
GRANT SELECT ON donor_statistics TO authenticated;

-- 6. Add helpful comments to tables
COMMENT ON TABLE gifts IS 'Stores all donations/gifts from contacts to organizations';
COMMENT ON COLUMN gifts.gift_type IS 'Type of gift: one_time, recurring, pledge, or in_kind';
COMMENT ON COLUMN gifts.thanked_at IS 'Timestamp when donor was thanked for this gift';
COMMENT ON COLUMN gifts.campaign IS 'Optional campaign or fundraising initiative this gift is associated with';

-- 7. Sample data for testing (optional - remove in production)
-- INSERT INTO gifts (organization_id, contact_id, amount, gift_date, gift_type, campaign)
-- VALUES (
--   'your-org-id',
--   'contact-id',
--   100.00,
--   '2024-01-15',
--   'one_time',
--   'Annual Fund 2024'
-- );
