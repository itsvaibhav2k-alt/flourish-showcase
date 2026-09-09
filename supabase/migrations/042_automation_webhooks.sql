-- Automation Webhooks and Scheduled Emails
-- Migration for Zapier/n8n integration support

-- ============================================================================
-- Automation Webhooks Table
-- Stores webhook configurations for external automation platforms
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  webhook_token TEXT NOT NULL UNIQUE,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('send_email', 'enroll_sequence', 'generate_custom_email', 'create_contact', 'update_contact')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast webhook token lookups
CREATE INDEX idx_automation_webhooks_token ON automation_webhooks(webhook_token);

-- Index for organization queries
CREATE INDEX idx_automation_webhooks_org ON automation_webhooks(organization_id);

-- ============================================================================
-- Scheduled Emails Table
-- Stores scheduled/recurring email configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('thank_you', 'reengagement', 'volunteer_confirmation', 'volunteer_reminder', 'custom')),
  custom_params JSONB,
  recipient_filter JSONB,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'cron')),
  cron_expression TEXT,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_run_result JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding due scheduled emails
CREATE INDEX idx_scheduled_emails_next_run ON scheduled_emails(next_run_at) WHERE is_active = true;

-- Index for organization queries
CREATE INDEX idx_scheduled_emails_org ON scheduled_emails(organization_id);

-- ============================================================================
-- API Keys Table (optional - for REST API authentication)
-- Provides more secure authentication than webhook tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Store hashed key, never plain text
  key_prefix TEXT NOT NULL, -- Store first 8 chars for identification
  permissions JSONB DEFAULT '["read"]', -- Array of permissions: read, write, admin
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for key prefix lookups (used to find key before hash verification)
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Index for organization queries
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);

-- ============================================================================
-- Webhook Logs Table
-- Tracks webhook invocations for debugging and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES automation_webhooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_method TEXT NOT NULL,
  request_path TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook log queries
CREATE INDEX idx_webhook_logs_webhook ON automation_webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_org ON automation_webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_created ON automation_webhook_logs(created_at DESC);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Automation Webhooks policies
CREATE POLICY "Users can view org automation webhooks"
  ON automation_webhooks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage automation webhooks"
  ON automation_webhooks FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Scheduled Emails policies
CREATE POLICY "Users can view org scheduled emails"
  ON scheduled_emails FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage scheduled emails"
  ON scheduled_emails FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- API Keys policies
CREATE POLICY "Users can view org api keys"
  ON api_keys FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage api keys"
  ON api_keys FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Webhook Logs policies
CREATE POLICY "Users can view org webhook logs"
  ON automation_webhook_logs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update webhook usage stats
CREATE OR REPLACE FUNCTION update_webhook_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automation_webhooks
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.webhook_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update usage on log insert
CREATE TRIGGER on_webhook_log_insert
  AFTER INSERT ON automation_webhook_logs
  FOR EACH ROW
  WHEN (NEW.webhook_id IS NOT NULL)
  EXECUTE FUNCTION update_webhook_usage();

-- Function to calculate next run time for scheduled emails
CREATE OR REPLACE FUNCTION calculate_next_run_at(
  schedule_type TEXT,
  cron_expression TEXT,
  last_run_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
  base_time TIMESTAMPTZ;
BEGIN
  base_time := COALESCE(last_run_at, NOW());

  CASE schedule_type
    WHEN 'once' THEN
      -- One-time scheduled emails don't have a next run after execution
      RETURN NULL;
    WHEN 'daily' THEN
      next_run := base_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_run := base_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      next_run := base_time + INTERVAL '1 month';
    WHEN 'cron' THEN
      -- For cron expressions, we'd need a more complex parser
      -- For now, default to daily
      next_run := base_time + INTERVAL '1 day';
    ELSE
      next_run := base_time + INTERVAL '1 day';
  END CASE;

  RETURN next_run;
END;
$$ LANGUAGE plpgsql;
