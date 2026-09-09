-- Migration 030: Add description column to custom_ai_tiles
-- The custom_ai_tiles table was missing a description column that the UI requires

ALTER TABLE custom_ai_tiles
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN custom_ai_tiles.description IS 'Brief description of what insights this custom tile provides';
