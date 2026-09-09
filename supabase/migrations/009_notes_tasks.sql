-- Migration 009: Notes and Tasks
-- Contact activity logging and task management

-- Contact notes table
CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notes_contact ON contact_notes(contact_id);

-- Contact tasks table
CREATE TABLE IF NOT EXISTS contact_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED')),
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_tasks_contact ON contact_tasks(contact_id);
CREATE INDEX idx_tasks_due ON contact_tasks(organization_id, due_date) WHERE status = 'OPEN';
CREATE INDEX idx_tasks_assigned ON contact_tasks(assigned_to) WHERE status = 'OPEN';

-- RLS policies
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org's notes" ON contact_notes
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's tasks" ON contact_tasks
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
