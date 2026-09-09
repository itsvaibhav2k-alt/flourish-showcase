-- Migration 008: Public Shifts
-- Enable public volunteer shift signup pages

-- Add is_public flag to shifts
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add slug to organizations for public URLs
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_slug text UNIQUE;

-- Create index for public shift queries
CREATE INDEX IF NOT EXISTS idx_shifts_public ON shifts(organization_id, is_public) WHERE is_public = true;
