-- Migration: Add AI next step suggestions toggle to organizations
-- This allows organizations to enable/disable AI-powered next step suggestions on contact pages

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_next_step_suggestions boolean DEFAULT true;

COMMENT ON COLUMN organizations.ai_next_step_suggestions IS
  'Enable AI-powered next step suggestions on contact detail pages';
