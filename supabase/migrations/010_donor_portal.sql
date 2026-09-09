-- Migration 010: Donor Portal
-- Self-service donor portal and AI customization

-- Add portal token for donor self-service
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS portal_token text UNIQUE;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_contacts_portal_token ON contacts(portal_token) WHERE portal_token IS NOT NULL;

-- Add tone preset and snippets for AI
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tone_preset text DEFAULT 'warm';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS snippets jsonb DEFAULT '[]';
