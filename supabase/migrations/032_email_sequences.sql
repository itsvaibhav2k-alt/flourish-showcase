-- Migration: Email Sequences & Drip Campaigns
-- Enables automated multi-step email journeys with AI generation

-- Email sequences (drip campaign definitions)
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('gift', 'signup', 'lapse_risk', 'manual', 'date', 'volunteer_signup', 'volunteer_completed')),
  trigger_config JSONB DEFAULT '{}', -- Additional trigger configuration (e.g., gift_amount_min, lapse_risk_level)
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- True for pre-built templates
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence steps (individual emails in a sequence)
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL, -- E.g., "Welcome Email", "First Follow-up"
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  template_type TEXT NOT NULL CHECK (template_type IN ('thank_you', 'appeal', 'reengagement', 'welcome', 'follow_up', 'custom')),
  subject_template TEXT, -- Subject line (can include {{variables}})
  custom_instructions TEXT, -- AI instructions for generation
  conditions JSONB DEFAULT '{}', -- When to skip/continue (e.g., {"skip_if_replied": true})
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(sequence_id, step_order)
);

-- Sequence enrollments (contacts enrolled in sequences)
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0, -- 0 = not started yet
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'failed')),
  trigger_event_id UUID, -- The ID of the event that triggered enrollment (gift ID, shift signup ID, etc.)
  trigger_event_type TEXT, -- The type of trigger event
  next_step_at TIMESTAMPTZ, -- When the next step should be processed
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate enrollments in the same sequence
  UNIQUE(sequence_id, contact_id, trigger_event_id)
);

-- Sequence step executions (log of each step execution)
CREATE TABLE IF NOT EXISTS sequence_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES email_sequence_steps(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES email_drafts(id), -- The generated email draft
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'sent', 'skipped', 'failed')),
  skip_reason TEXT, -- Why the step was skipped (if applicable)
  error_message TEXT, -- Error details if failed
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sequences_org_id ON email_sequences(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_active ON email_sequences(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_sequence_id ON email_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_org_id ON sequence_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_contact_id ON sequence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_step ON sequence_enrollments(next_step_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_enrollment ON sequence_step_executions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_pending ON sequence_step_executions(status, scheduled_at) WHERE status = 'pending';

-- RLS policies
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_step_executions ENABLE ROW LEVEL SECURITY;

-- email_sequences policies
CREATE POLICY "Users can view sequences for their organization"
  ON email_sequences FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sequences for their organization"
  ON email_sequences FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sequences for their organization"
  ON email_sequences FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sequences for their organization"
  ON email_sequences FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- email_sequence_steps policies
CREATE POLICY "Users can view steps for their sequences"
  ON email_sequence_steps FOR SELECT
  USING (
    sequence_id IN (
      SELECT es.id FROM email_sequences es
      WHERE es.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage steps for their sequences"
  ON email_sequence_steps FOR ALL
  USING (
    sequence_id IN (
      SELECT es.id FROM email_sequences es
      WHERE es.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
      )
    )
  );

-- sequence_enrollments policies
CREATE POLICY "Users can view enrollments for their organization"
  ON sequence_enrollments FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage enrollments for their organization"
  ON sequence_enrollments FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- sequence_step_executions policies
CREATE POLICY "Users can view executions for their enrollments"
  ON sequence_step_executions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT se.id FROM sequence_enrollments se
      WHERE se.organization_id IN (
        SELECT om.organization_id
        FROM organization_members om
        WHERE om.user_id = auth.uid()
      )
    )
  );

-- Service role can manage all for background jobs
CREATE POLICY "Service role full access to step executions"
  ON sequence_step_executions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to calculate next step time
CREATE OR REPLACE FUNCTION calculate_next_step_time(
  p_enrollment_id UUID
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_current_step INTEGER;
  v_next_step RECORD;
BEGIN
  -- Get current step from enrollment
  SELECT current_step INTO v_current_step
  FROM sequence_enrollments
  WHERE id = p_enrollment_id;

  -- Get next step details
  SELECT * INTO v_next_step
  FROM email_sequence_steps
  WHERE sequence_id = (
    SELECT sequence_id FROM sequence_enrollments WHERE id = p_enrollment_id
  )
  AND step_order = v_current_step + 1;

  IF v_next_step IS NULL THEN
    RETURN NULL; -- No more steps
  END IF;

  -- Calculate next step time based on delays
  RETURN now() +
    (v_next_step.delay_days || ' days')::INTERVAL +
    (v_next_step.delay_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Insert placeholder organization for templates (if not exists)
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Templates', 'system-templates')
ON CONFLICT (id) DO NOTHING;

-- Insert pre-built sequence templates
INSERT INTO email_sequences (id, organization_id, name, description, trigger_type, trigger_config, is_active, is_template)
VALUES
  -- Note: These are templates, they need to be copied to each organization
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'New Donor Welcome',
   'Welcome series for first-time donors - 3 emails over 2 weeks',
   'gift',
   '{"first_gift_only": true}'::jsonb,
   false,
   true),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'Lapsed Donor Re-engagement',
   'Re-engagement series for lapsed donors - 4 emails over 1 month',
   'lapse_risk',
   '{"risk_level": "high"}'::jsonb,
   false,
   true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'Volunteer Onboarding',
   'Onboarding series for new volunteers - 2 emails over 1 week',
   'volunteer_signup',
   '{}'::jsonb,
   false,
   true),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'Year-End Appeal',
   'Year-end giving campaign - 5 emails over 6 weeks',
   'date',
   '{"start_date": "11-01", "recurring": true}'::jsonb,
   false,
   true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE email_sequences IS 'Email sequence definitions for drip campaigns and automated email journeys';
COMMENT ON TABLE email_sequence_steps IS 'Individual steps within an email sequence with timing and conditions';
COMMENT ON TABLE sequence_enrollments IS 'Tracks contacts enrolled in email sequences';
COMMENT ON TABLE sequence_step_executions IS 'Log of individual step executions for audit and debugging';
