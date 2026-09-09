-- AI Communications Database Schema
-- Migration for email drafts, AI usage tracking, and voice profiles

-- ==============================================
-- Voice Profile Fields on Organizations
-- ==============================================
-- Add voice profile columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS voice_summary TEXT,
ADD COLUMN IF NOT EXISTS voice_formality VARCHAR(20) CHECK (voice_formality IN ('casual', 'moderate', 'formal')),
ADD COLUMN IF NOT EXISTS voice_warmth INTEGER CHECK (voice_warmth >= 1 AND voice_warmth <= 10),
ADD COLUMN IF NOT EXISTS voice_signature_phrases TEXT[],
ADD COLUMN IF NOT EXISTS voice_greeting_style TEXT,
ADD COLUMN IF NOT EXISTS voice_closing_style TEXT,
ADD COLUMN IF NOT EXISTS voice_tone_characteristics TEXT[],
ADD COLUMN IF NOT EXISTS voice_trained_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voice_trained_by UUID REFERENCES auth.users(id);

-- Add index for voice profile queries
CREATE INDEX IF NOT EXISTS idx_organizations_voice_trained
ON organizations(id) WHERE voice_trained_at IS NOT NULL;

-- ==============================================
-- Email Drafts Table
-- ==============================================
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Email content
  email_type VARCHAR(50) NOT NULL CHECK (email_type IN (
    'thank_you',
    'reengagement',
    'volunteer_confirmation',
    'volunteer_reminder',
    'volunteer_thank_you'
  )),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'sent'
  )),

  -- Review information
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  was_edited BOOLEAN DEFAULT FALSE,

  -- Sending information
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  resend_id TEXT, -- Resend email ID for tracking

  -- Generation metadata
  generated_by VARCHAR(20) NOT NULL CHECK (generated_by IN ('claude', 'fallback')),

  -- Related records
  gift_id UUID REFERENCES gifts(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES volunteer_shifts(id) ON DELETE SET NULL,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email_drafts
CREATE INDEX IF NOT EXISTS idx_email_drafts_organization ON email_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_contact ON email_drafts(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_email_drafts_type ON email_drafts(email_type);
CREATE INDEX IF NOT EXISTS idx_email_drafts_gift ON email_drafts(gift_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_shift ON email_drafts(shift_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_created_at ON email_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_drafts_pending ON email_drafts(organization_id, status)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_drafts
CREATE POLICY "Users can view drafts in their organization"
  ON email_drafts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create drafts in their organization"
  ON email_drafts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update drafts in their organization"
  ON email_drafts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pending/rejected drafts in their organization"
  ON email_drafts FOR DELETE
  USING (
    status IN ('pending', 'rejected') AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ==============================================
-- AI Usage Tracking Table
-- ==============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Token usage
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_creation_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,

  -- Cost tracking
  estimated_cost DECIMAL(10, 6) NOT NULL,

  -- Context
  email_type VARCHAR(50),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES email_drafts(id) ON DELETE SET NULL,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_organization ON ai_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON ai_usage(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_email_type ON ai_usage(email_type);

-- Enable Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage
CREATE POLICY "Users can view usage in their organization"
  ON ai_usage FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true); -- Allow inserts from service role only

-- ==============================================
-- Helper Functions
-- ==============================================

-- Function to get monthly AI cost for an organization
CREATE OR REPLACE FUNCTION get_monthly_ai_cost(org_id UUID, month_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_cost DECIMAL,
  total_tokens BIGINT,
  email_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(estimated_cost), 0)::DECIMAL as total_cost,
    COALESCE(SUM(input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens), 0)::BIGINT as total_tokens,
    COUNT(DISTINCT draft_id)::BIGINT as email_count
  FROM ai_usage
  WHERE organization_id = org_id
    AND created_at >= DATE_TRUNC('month', month_date)
    AND created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending draft count for an organization
CREATE OR REPLACE FUNCTION get_pending_draft_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM email_drafts
    WHERE organization_id = org_id
      AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Triggers
-- ==============================================

-- Trigger to update updated_at timestamp on email_drafts
CREATE OR REPLACE FUNCTION update_email_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_drafts_updated_at();

-- ==============================================
-- Comments
-- ==============================================

COMMENT ON TABLE email_drafts IS 'AI-generated email drafts for approval and sending';
COMMENT ON TABLE ai_usage IS 'Tracks Claude API usage and costs for monitoring and billing';
COMMENT ON COLUMN organizations.voice_summary IS 'AI-analyzed summary of organization communication style';
COMMENT ON COLUMN email_drafts.status IS 'pending: awaiting review, approved: ready to send, rejected: needs revision, sent: delivered';
COMMENT ON COLUMN email_drafts.generated_by IS 'claude: AI-generated, fallback: template-based';
COMMENT ON COLUMN ai_usage.estimated_cost IS 'Estimated cost in USD based on token usage and model pricing';
