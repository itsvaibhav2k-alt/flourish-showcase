-- Migration 048: Voice Calls (Retell AI Integration)
-- Adds tables for voice calling with Flora via Retell AI

-- ============================================================================
-- VOICE_CALLS TABLE
-- Tracks all voice calls made through Flora
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Retell identifiers
  retell_call_id TEXT UNIQUE,
  retell_agent_id TEXT,

  -- Call classification
  call_type TEXT NOT NULL CHECK (call_type IN (
    'thank_you', 'reengagement', 'shift_reminder',
    'cultivation', 'campaign_outreach', 'custom'
  )),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'queued', 'ringing', 'in_progress',
    'completed', 'failed', 'no_answer', 'busy',
    'voicemail', 'cancelled'
  )),

  -- Phone details
  from_phone TEXT,
  to_phone TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Context and script
  context_snapshot JSONB DEFAULT '{}',
  call_script JSONB DEFAULT '{}',

  -- Trigger info (like email_drafts pattern)
  trigger_event TEXT,
  trigger_event_id UUID,

  -- Outcomes
  outcome TEXT,
  sentiment TEXT CHECK (sentiment IS NULL OR sentiment IN (
    'very_positive', 'positive', 'neutral', 'negative', 'very_negative'
  )),
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,

  -- Cost tracking
  estimated_cost DECIMAL(10, 6) DEFAULT 0,

  -- Who initiated the call
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for voice_calls
CREATE INDEX idx_voice_calls_org_id ON voice_calls(organization_id);
CREATE INDEX idx_voice_calls_contact_id ON voice_calls(contact_id);
CREATE INDEX idx_voice_calls_retell_call_id ON voice_calls(retell_call_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(organization_id, status);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at DESC);
CREATE INDEX idx_voice_calls_call_type ON voice_calls(organization_id, call_type);

-- Updated_at trigger
CREATE TRIGGER update_voice_calls_updated_at
  BEFORE UPDATE ON voice_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CALL_TRANSCRIPTS TABLE
-- Stores transcripts and AI analysis of voice calls
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transcript data
  transcript JSONB DEFAULT '[]', -- Array of {role, content, timestamp}

  -- AI analysis
  summary TEXT,
  key_topics TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  sentiment_analysis JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for call_transcripts
CREATE INDEX idx_call_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX idx_call_transcripts_org_id ON call_transcripts(organization_id);

-- Updated_at trigger
CREATE TRIGGER update_call_transcripts_updated_at
  BEFORE UPDATE ON call_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RETELL_AGENTS TABLE
-- Maps org voice profiles to Retell agent configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS retell_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Retell identifiers
  retell_agent_id TEXT UNIQUE NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'outbound' CHECK (agent_type IN ('outbound', 'inbound')),
  agent_name TEXT,

  -- Voice configuration
  retell_voice_id TEXT,
  voice_speed DECIMAL(3, 2) DEFAULT 1.0,
  voice_temperature DECIMAL(3, 2) DEFAULT 0.7,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  voice_profile_hash TEXT,
  config_snapshot JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for retell_agents
CREATE INDEX idx_retell_agents_org_id ON retell_agents(organization_id);
CREATE INDEX idx_retell_agents_retell_agent_id ON retell_agents(retell_agent_id);
CREATE INDEX idx_retell_agents_active ON retell_agents(organization_id, is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER update_retell_agents_updated_at
  BEFORE UPDATE ON retell_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ALTER ORGANIZATIONS TABLE
-- Add voice call settings
-- ============================================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS voice_calls_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_thank_you_calls BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reengagement_calls BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_shift_reminders BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_monthly_budget DECIMAL(10, 2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS retell_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS voice_call_hours_start INTEGER DEFAULT 9,
  ADD COLUMN IF NOT EXISTS voice_call_hours_end INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS voice_thank_you_threshold DECIMAL(12, 2) DEFAULT 100.00;

-- ============================================================================
-- ALTER CONTACTS TABLE
-- Add phone call opt-out
-- ============================================================================
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS phone_call_opt_out BOOLEAN DEFAULT false;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;

-- voice_calls policies
CREATE POLICY "voice_calls_select" ON voice_calls
  FOR SELECT USING (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "voice_calls_insert" ON voice_calls
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "voice_calls_update" ON voice_calls
  FOR UPDATE USING (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "voice_calls_delete" ON voice_calls
  FOR DELETE USING (
    organization_id IN (SELECT user_org_ids())
  );

-- call_transcripts policies
CREATE POLICY "call_transcripts_select" ON call_transcripts
  FOR SELECT USING (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "call_transcripts_insert" ON call_transcripts
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "call_transcripts_update" ON call_transcripts
  FOR UPDATE USING (
    organization_id IN (SELECT user_org_ids())
  );

-- retell_agents policies
CREATE POLICY "retell_agents_select" ON retell_agents
  FOR SELECT USING (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "retell_agents_insert" ON retell_agents
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT user_org_ids())
  );

CREATE POLICY "retell_agents_update" ON retell_agents
  FOR UPDATE USING (
    organization_id IN (SELECT user_org_ids())
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE voice_calls IS 'Tracks voice calls made through Flora via Retell AI';
COMMENT ON TABLE call_transcripts IS 'Stores transcripts and AI analysis of voice calls';
COMMENT ON TABLE retell_agents IS 'Maps organization voice profiles to Retell agent configurations';
COMMENT ON COLUMN voice_calls.context_snapshot IS 'Snapshot of donor/volunteer context at time of call';
COMMENT ON COLUMN voice_calls.call_script IS 'AI-generated talking points for the call';
COMMENT ON COLUMN voice_calls.trigger_event IS 'Event type that triggered this call (e.g., gift_received)';
COMMENT ON COLUMN voice_calls.trigger_event_id IS 'ID of the triggering event (e.g., gift ID)';
COMMENT ON COLUMN voice_calls.estimated_cost IS 'Estimated cost in USD for Retell telephony + LLM usage';
COMMENT ON COLUMN retell_agents.voice_profile_hash IS 'Hash of voice profile fields to detect changes requiring re-sync';
COMMENT ON COLUMN organizations.voice_call_hours_start IS 'Start hour for calling window (0-23, default 9 AM)';
COMMENT ON COLUMN organizations.voice_call_hours_end IS 'End hour for calling window (0-23, default 8 PM)';
COMMENT ON COLUMN organizations.voice_thank_you_threshold IS 'Minimum gift amount to trigger automatic thank-you call';
COMMENT ON COLUMN contacts.phone_call_opt_out IS 'Whether the contact has opted out of phone calls';
