-- Migration: Email Tracking
-- Adds email event tracking for opens, clicks, bounces, and complaints

-- Create email_events table to store webhook events from Resend
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES email_drafts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  resend_id TEXT, -- The Resend email ID for correlation
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked', 'bounced', 'complained', 'delivery_delayed')),
  event_data JSONB DEFAULT '{}', -- Additional event metadata (link clicked, bounce reason, etc.)
  user_agent TEXT, -- Browser/client info for opens/clicks
  ip_address TEXT, -- IP address (for geo-location if needed)
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add tracking columns to email_drafts
ALTER TABLE email_drafts
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_opens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_events_org_id ON email_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_events_draft_id ON email_events(draft_id);
CREATE INDEX IF NOT EXISTS idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_drafts_resend_id ON email_drafts(resend_id) WHERE resend_id IS NOT NULL;

-- RLS policies for email_events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Users can view email events for their organization
CREATE POLICY "Users can view email events for their organization"
  ON email_events FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- Only system (service role) can insert email events (from webhooks)
CREATE POLICY "Service role can insert email events"
  ON email_events FOR INSERT
  WITH CHECK (true);

-- Function to update email_drafts when events occur
CREATE OR REPLACE FUNCTION update_draft_on_email_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the email_drafts table based on the event type
  CASE NEW.event_type
    WHEN 'delivered' THEN
      UPDATE email_drafts
      SET delivered_at = COALESCE(delivered_at, NEW.occurred_at)
      WHERE id = NEW.draft_id;

    WHEN 'opened' THEN
      UPDATE email_drafts
      SET
        opened_at = COALESCE(opened_at, NEW.occurred_at),
        open_count = open_count + 1,
        unique_opens = CASE
          WHEN opened_at IS NULL THEN unique_opens + 1
          ELSE unique_opens
        END
      WHERE id = NEW.draft_id;

    WHEN 'clicked' THEN
      UPDATE email_drafts
      SET
        clicked_at = COALESCE(clicked_at, NEW.occurred_at),
        click_count = click_count + 1,
        unique_clicks = CASE
          WHEN clicked_at IS NULL THEN unique_clicks + 1
          ELSE unique_clicks
        END
      WHERE id = NEW.draft_id;

    WHEN 'bounced' THEN
      UPDATE email_drafts
      SET bounced_at = COALESCE(bounced_at, NEW.occurred_at)
      WHERE id = NEW.draft_id;

    ELSE
      -- No action for other event types
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update drafts when events are inserted
DROP TRIGGER IF EXISTS trigger_update_draft_on_email_event ON email_events;
CREATE TRIGGER trigger_update_draft_on_email_event
  AFTER INSERT ON email_events
  FOR EACH ROW
  WHEN (NEW.draft_id IS NOT NULL)
  EXECUTE FUNCTION update_draft_on_email_event();

-- Create aggregate view for email stats
CREATE OR REPLACE VIEW email_tracking_stats AS
SELECT
  ed.organization_id,
  COUNT(*) FILTER (WHERE ed.status = 'sent') as total_sent,
  COUNT(*) FILTER (WHERE ed.delivered_at IS NOT NULL) as total_delivered,
  COUNT(*) FILTER (WHERE ed.opened_at IS NOT NULL) as total_opened,
  COUNT(*) FILTER (WHERE ed.clicked_at IS NOT NULL) as total_clicked,
  COUNT(*) FILTER (WHERE ed.bounced_at IS NOT NULL) as total_bounced,
  ROUND(
    COUNT(*) FILTER (WHERE ed.opened_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE ed.delivered_at IS NOT NULL), 0) * 100,
    2
  ) as open_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ed.clicked_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE ed.opened_at IS NOT NULL), 0) * 100,
    2
  ) as click_rate
FROM email_drafts ed
WHERE ed.status = 'sent'
GROUP BY ed.organization_id;

-- Grant access to the view
GRANT SELECT ON email_tracking_stats TO authenticated;

COMMENT ON TABLE email_events IS 'Stores email tracking events from Resend webhooks (opens, clicks, bounces, etc.)';
COMMENT ON VIEW email_tracking_stats IS 'Aggregate email tracking statistics per organization';
