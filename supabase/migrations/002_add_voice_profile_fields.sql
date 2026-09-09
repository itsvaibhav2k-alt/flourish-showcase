-- Add voice profile fields to organizations table
-- These fields store the AI-analyzed communication style for email generation

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS voice_formality TEXT CHECK (voice_formality IN ('casual', 'moderate', 'formal')),
ADD COLUMN IF NOT EXISTS voice_warmth INTEGER CHECK (voice_warmth >= 1 AND voice_warmth <= 10),
ADD COLUMN IF NOT EXISTS voice_signature_phrases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS voice_greeting_style TEXT,
ADD COLUMN IF NOT EXISTS voice_closing_style TEXT,
ADD COLUMN IF NOT EXISTS voice_tone_characteristics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS voice_trained_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voice_trained_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for organizations with trained voice profiles
CREATE INDEX IF NOT EXISTS idx_organizations_voice_trained
ON organizations(voice_trained_at)
WHERE voice_trained_at IS NOT NULL;

-- Add comment explaining the voice profile fields
COMMENT ON COLUMN organizations.voice_summary IS 'AI-generated summary of organization communication style';
COMMENT ON COLUMN organizations.voice_formality IS 'Level of formality: casual, moderate, or formal';
COMMENT ON COLUMN organizations.voice_warmth IS 'Warmth score from 1-10';
COMMENT ON COLUMN organizations.voice_signature_phrases IS 'Commonly used phrases unique to organization';
COMMENT ON COLUMN organizations.voice_greeting_style IS 'How organization typically greets recipients';
COMMENT ON COLUMN organizations.voice_closing_style IS 'How organization typically closes emails';
COMMENT ON COLUMN organizations.voice_tone_characteristics IS 'Descriptive words capturing voice tone';
COMMENT ON COLUMN organizations.voice_trained_at IS 'When voice profile was last trained';
COMMENT ON COLUMN organizations.voice_trained_by IS 'User ID who trained the voice';
