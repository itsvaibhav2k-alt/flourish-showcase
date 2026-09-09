-- Migration 051: Band Boosters MVP
-- Adds sponsorship tracking, call queues, recurring shifts, tax receipt fields

-- ============================================================================
-- SPONSORSHIP_TIERS TABLE
-- Org-level tier definitions (e.g., Bronze $100, Silver $250, Gold $500)
-- ============================================================================
CREATE TABLE sponsorship_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  default_benefits JSONB DEFAULT '[]',
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_sponsorship_tiers_org_id ON sponsorship_tiers(organization_id);
CREATE INDEX idx_sponsorship_tiers_active ON sponsorship_tiers(organization_id, is_active) WHERE is_active = true;

CREATE TRIGGER update_sponsorship_tiers_updated_at
  BEFORE UPDATE ON sponsorship_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SPONSORSHIPS TABLE
-- Individual sponsor records linked to contacts
-- ============================================================================
CREATE TABLE sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES sponsorship_tiers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN (
    'prospect', 'pitched', 'confirmed', 'active', 'lapsed', 'declined'
  )),
  amount DECIMAL(12,2),
  season TEXT,
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  payment_received BOOLEAN DEFAULT false,
  notes TEXT,
  assigned_to UUID,
  last_contact_date TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsorships_org_id ON sponsorships(organization_id);
CREATE INDEX idx_sponsorships_contact_id ON sponsorships(contact_id);
CREATE INDEX idx_sponsorships_tier_id ON sponsorships(tier_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(organization_id, status);
CREATE INDEX idx_sponsorships_renewal ON sponsorships(renewal_date) WHERE status = 'active';

CREATE TRIGGER update_sponsorships_updated_at
  BEFORE UPDATE ON sponsorships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SPONSORSHIP_BENEFITS TABLE
-- Per-sponsor benefit delivery tracking
-- ============================================================================
CREATE TABLE sponsorship_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id UUID NOT NULL REFERENCES sponsorships(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  benefit_name TEXT NOT NULL,
  description TEXT,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  delivered_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsorship_benefits_sponsorship_id ON sponsorship_benefits(sponsorship_id);
CREATE INDEX idx_sponsorship_benefits_org_id ON sponsorship_benefits(organization_id);
CREATE INDEX idx_sponsorship_benefits_pending ON sponsorship_benefits(sponsorship_id, delivered) WHERE delivered = false;

-- ============================================================================
-- CALL_QUEUES TABLE
-- Manages sequential call lists for Flora
-- ============================================================================
CREATE TABLE call_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  call_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'paused', 'completed', 'cancelled'
  )),
  stop_condition JSONB DEFAULT '{}',
  max_retries INTEGER DEFAULT 1,
  retry_delay_hours INTEGER DEFAULT 24,
  current_index INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  calls_connected INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_queues_org_id ON call_queues(organization_id);
CREATE INDEX idx_call_queues_status ON call_queues(organization_id, status);

CREATE TRIGGER update_call_queues_updated_at
  BEFORE UPDATE ON call_queues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CALL_QUEUE_ITEMS TABLE
-- Per-contact items in a call queue
-- ============================================================================
CREATE TABLE call_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES call_queues(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'failed'
  )),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_outcome TEXT,
  voice_call_id UUID REFERENCES voice_calls(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_queue_items_queue_id ON call_queue_items(queue_id);
CREATE INDEX idx_call_queue_items_contact_id ON call_queue_items(contact_id);
CREATE INDEX idx_call_queue_items_status ON call_queue_items(queue_id, status);
CREATE INDEX idx_call_queue_items_sort ON call_queue_items(queue_id, sort_order);

-- ============================================================================
-- ALTER SHIFTS TABLE
-- Add recurring shift support
-- ============================================================================
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

CREATE INDEX idx_shifts_recurrence_parent ON shifts(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;

-- ============================================================================
-- ALTER SHIFT_SIGNUPS TABLE
-- Add morning reminder flag
-- ============================================================================
ALTER TABLE shift_signups
  ADD COLUMN IF NOT EXISTS morning_reminder_sent BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- ALTER ORGANIZATIONS TABLE
-- Add tax receipt fields
-- ============================================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ein TEXT,
  ADD COLUMN IF NOT EXISTS tax_exempt_status TEXT,
  ADD COLUMN IF NOT EXISTS tax_receipt_footer TEXT;

-- ============================================================================
-- EXPAND VOICE_CALLS CALL_TYPE CHECK
-- Add sponsor_outreach, employer_match, fee_reminder
-- ============================================================================
ALTER TABLE voice_calls DROP CONSTRAINT IF EXISTS voice_calls_call_type_check;
ALTER TABLE voice_calls ADD CONSTRAINT voice_calls_call_type_check CHECK (call_type IN (
  'thank_you', 'reengagement', 'shift_reminder',
  'cultivation', 'campaign_outreach', 'custom',
  'donation_ask', 'volunteer_recruitment', 'event_invitation',
  'follow_up', 'survey',
  'sponsor_outreach', 'employer_match', 'fee_reminder'
));

-- ============================================================================
-- EXPAND GIFTS PAYMENT_METHOD CHECK
-- Add venmo, zelle
-- ============================================================================
ALTER TABLE gifts DROP CONSTRAINT IF EXISTS gifts_payment_method_check;
ALTER TABLE gifts ADD CONSTRAINT gifts_payment_method_check CHECK (
  payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'venmo', 'zelle', 'other')
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sponsorship_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue_items ENABLE ROW LEVEL SECURITY;

-- Sponsorship tiers policies
CREATE POLICY "sponsorship_tiers_select" ON sponsorship_tiers
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_tiers_insert" ON sponsorship_tiers
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_tiers_update" ON sponsorship_tiers
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_tiers_delete" ON sponsorship_tiers
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- Sponsorships policies
CREATE POLICY "sponsorships_select" ON sponsorships
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorships_insert" ON sponsorships
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorships_update" ON sponsorships
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorships_delete" ON sponsorships
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- Sponsorship benefits policies
CREATE POLICY "sponsorship_benefits_select" ON sponsorship_benefits
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_benefits_insert" ON sponsorship_benefits
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_benefits_update" ON sponsorship_benefits
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "sponsorship_benefits_delete" ON sponsorship_benefits
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- Call queues policies
CREATE POLICY "call_queues_select" ON call_queues
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "call_queues_insert" ON call_queues
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "call_queues_update" ON call_queues
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

CREATE POLICY "call_queues_delete" ON call_queues
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- Call queue items policies (via queue's org)
CREATE POLICY "call_queue_items_select" ON call_queue_items
  FOR SELECT USING (
    queue_id IN (SELECT id FROM call_queues WHERE organization_id IN (SELECT user_org_ids()))
  );

CREATE POLICY "call_queue_items_insert" ON call_queue_items
  FOR INSERT WITH CHECK (
    queue_id IN (SELECT id FROM call_queues WHERE organization_id IN (SELECT user_org_ids()))
  );

CREATE POLICY "call_queue_items_update" ON call_queue_items
  FOR UPDATE USING (
    queue_id IN (SELECT id FROM call_queues WHERE organization_id IN (SELECT user_org_ids()))
  );

CREATE POLICY "call_queue_items_delete" ON call_queue_items
  FOR DELETE USING (
    queue_id IN (SELECT id FROM call_queues WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE sponsorship_tiers IS 'Organization-level sponsorship tier definitions';
COMMENT ON TABLE sponsorships IS 'Individual sponsor records linked to contacts';
COMMENT ON TABLE sponsorship_benefits IS 'Per-sponsor benefit delivery tracking';
COMMENT ON TABLE call_queues IS 'Manages sequential call lists for Flora voice agent';
COMMENT ON TABLE call_queue_items IS 'Per-contact items in a call queue';
COMMENT ON COLUMN sponsorships.season IS 'Season label e.g. 2025-2026 Marching Season';
COMMENT ON COLUMN call_queues.stop_condition IS 'JSON describing when to stop: {type: "count", value: N} or {type: "all"}';
COMMENT ON COLUMN organizations.ein IS 'Employer Identification Number for tax receipts';
COMMENT ON COLUMN organizations.tax_exempt_status IS 'Tax-exempt status e.g. 501(c)(3)';
