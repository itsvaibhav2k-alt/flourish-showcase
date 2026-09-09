-- AI Communications Database Schema
-- Migration for AI usage tracking

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
  WITH CHECK (true);

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

-- ==============================================
-- Comments
-- ==============================================

COMMENT ON TABLE ai_usage IS 'Tracks Claude API usage and costs for monitoring and billing';
COMMENT ON COLUMN ai_usage.estimated_cost IS 'Estimated cost in USD based on token usage and model pricing';
