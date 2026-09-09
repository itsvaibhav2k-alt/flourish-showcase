-- Migration: Add Stripe settings and external form webhooks
-- Description: Adds Stripe integration columns to organizations and creates external_form_webhooks table

-- 1. Add Stripe settings columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS stripe_mode TEXT DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));

-- 2. Create external_form_webhooks table
CREATE TABLE IF NOT EXISTS external_form_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    webhook_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    field_mapping JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    submission_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on external_form_webhooks table
ALTER TABLE external_form_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for organization access
CREATE POLICY external_form_webhooks_org_access ON external_form_webhooks
    FOR ALL
    USING (organization_id IN (SELECT user_org_ids()));

-- 4. Create index on webhook_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_external_webhooks_token ON external_form_webhooks(webhook_token);
