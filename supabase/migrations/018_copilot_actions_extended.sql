-- Migration 017: Extend Copilot Actions Table
-- Add additional fields for AI predictions and metadata

-- Add new columns to copilot_actions table
ALTER TABLE copilot_actions
ADD COLUMN IF NOT EXISTS predicted_gift_amount NUMERIC,
ADD COLUMN IF NOT EXISTS predicted_success_rate INTEGER CHECK (predicted_success_rate >= 0 AND predicted_success_rate <= 100),
ADD COLUMN IF NOT EXISTS optimal_timing TEXT,
ADD COLUMN IF NOT EXISTS preferred_channel TEXT CHECK (preferred_channel IN ('email', 'phone', 'mail', 'in_person')),
ADD COLUMN IF NOT EXISTS donor_score INTEGER CHECK (donor_score >= 0 AND donor_score <= 100),
ADD COLUMN IF NOT EXISTS donor_score_reasoning TEXT,
ADD COLUMN IF NOT EXISTS context_snapshot JSONB,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_copilot_actions_status ON copilot_actions(status);

-- Create index on generated_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_copilot_actions_generated_at ON copilot_actions(generated_at DESC);

-- Update the pending index to use status instead of null checks
DROP INDEX IF EXISTS idx_copilot_actions_pending;
CREATE INDEX idx_copilot_actions_pending_v2 ON copilot_actions(organization_id, priority DESC)
    WHERE status = 'pending';

-- Add comment explaining the context_snapshot structure
COMMENT ON COLUMN copilot_actions.context_snapshot IS 'JSON snapshot of donor context at time of action generation. Structure: {lifetimeGiving, totalGifts, lastGiftDate, lastGiftAmount, lapseRisk, segment}';
