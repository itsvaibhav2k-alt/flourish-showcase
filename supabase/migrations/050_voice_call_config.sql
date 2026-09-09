-- Add voice_call_config JSONB column to organizations
-- Stores org knowledge, call behavior settings, and per-call-type script overrides
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS voice_call_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN organizations.voice_call_config IS 'Voice call configuration: org knowledge, call behavior, and per-call-type script overrides';
