-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}',
    voice_samples TEXT[] DEFAULT '{}',
    voice_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_donor BOOLEAN DEFAULT FALSE,
    is_volunteer BOOLEAN DEFAULT FALSE,
    lifetime_giving DECIMAL(12,2) DEFAULT 0,
    total_gifts INTEGER DEFAULT 0,
    last_gift_date TIMESTAMPTZ,
    lapse_risk TEXT CHECK (lapse_risk IN ('low', 'medium', 'high')),
    total_volunteer_hours DECIMAL(10,2) DEFAULT 0,
    reliability_score DECIMAL(3,2) CHECK (reliability_score >= 0 AND reliability_score <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_donor ON contacts(is_donor) WHERE is_donor = TRUE;
CREATE INDEX idx_contacts_is_volunteer ON contacts(is_volunteer) WHERE is_volunteer = TRUE;
CREATE INDEX idx_contacts_archived ON contacts(archived_at) WHERE archived_at IS NOT NULL;

-- ============================================================================
-- GIFTS TABLE
-- ============================================================================
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    gift_date TIMESTAMPTZ NOT NULL,
    gift_type TEXT CHECK (gift_type IN ('one-time', 'recurring', 'pledge', 'in-kind')),
    campaign TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'other')),
    notes TEXT,
    thanked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gifts_org_id ON gifts(organization_id);
CREATE INDEX idx_gifts_contact_id ON gifts(contact_id);
CREATE INDEX idx_gifts_gift_date ON gifts(gift_date DESC);
CREATE INDEX idx_gifts_thanked_at ON gifts(thanked_at) WHERE thanked_at IS NULL;
CREATE INDEX idx_gifts_campaign ON gifts(campaign) WHERE campaign IS NOT NULL;

-- ============================================================================
-- SHIFTS TABLE
-- ============================================================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'full', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_org_id ON shifts(organization_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_status ON shifts(status);

-- ============================================================================
-- SHIFT SIGNUPS TABLE
-- ============================================================================
CREATE TABLE shift_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    checked_in_at TIMESTAMPTZ,
    hours_logged DECIMAL(5,2) CHECK (hours_logged >= 0),
    no_show BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_1_sent BOOLEAN DEFAULT FALSE,
    reminder_2_sent BOOLEAN DEFAULT FALSE,
    thank_you_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shift_id, contact_id)
);

CREATE INDEX idx_shift_signups_shift_id ON shift_signups(shift_id);
CREATE INDEX idx_shift_signups_contact_id ON shift_signups(contact_id);
CREATE INDEX idx_shift_signups_status ON shift_signups(status);
CREATE INDEX idx_shift_signups_no_show ON shift_signups(no_show) WHERE no_show = TRUE;

-- ============================================================================
-- EMAIL DRAFTS TABLE
-- ============================================================================
CREATE TABLE email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('thank_you', 'confirmation', 'reminder', 'follow_up', 'welcome', 'custom')),
    trigger_event TEXT CHECK (trigger_event IN ('gift_received', 'shift_signup', 'shift_reminder', 'shift_completed', 'manual')),
    trigger_event_id UUID,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    model_used TEXT,
    prompt_version TEXT,
    context_snapshot JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'sent', 'failed')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_drafts_org_id ON email_drafts(organization_id);
CREATE INDEX idx_email_drafts_contact_id ON email_drafts(contact_id);
CREATE INDEX idx_email_drafts_status ON email_drafts(status);
CREATE INDEX idx_email_drafts_email_type ON email_drafts(email_type);
CREATE INDEX idx_email_drafts_created_at ON email_drafts(created_at DESC);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('gift', 'shift_signup', 'shift_completed', 'email_sent', 'note_added', 'contact_created', 'contact_updated', 'other')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_org_id ON activities(organization_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_occurred_at ON activities(occurred_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Helper function to get current organization ID from JWT or request headers
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Try to get from JWT claim first
    org_id := NULLIF(current_setting('request.jwt.claims', true)::json->>'organization_id', '')::UUID;

    -- If not in JWT, try custom header
    IF org_id IS NULL THEN
        org_id := NULLIF(current_setting('request.headers', true)::json->>'x-organization-id', '')::UUID;
    END IF;

    RETURN org_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Organizations: Users can only see organizations they're members of
CREATE POLICY organizations_select_policy ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY organizations_insert_policy ON organizations
    FOR INSERT
    WITH CHECK (TRUE); -- Allow creating orgs, membership will be managed separately

CREATE POLICY organizations_update_policy ON organizations
    FOR UPDATE
    USING (
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Organization Members: Users can see members of their organizations
CREATE POLICY organization_members_select_policy ON organization_members
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY organization_members_insert_policy ON organization_members
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY organization_members_delete_policy ON organization_members
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Contacts: Isolated by organization
CREATE POLICY contacts_select_policy ON contacts
    FOR SELECT
    USING (organization_id = get_current_organization_id());

CREATE POLICY contacts_insert_policy ON contacts
    FOR INSERT
    WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY contacts_update_policy ON contacts
    FOR UPDATE
    USING (organization_id = get_current_organization_id());

CREATE POLICY contacts_delete_policy ON contacts
    FOR DELETE
    USING (organization_id = get_current_organization_id());

-- Gifts: Isolated by organization
CREATE POLICY gifts_select_policy ON gifts
    FOR SELECT
    USING (organization_id = get_current_organization_id());

CREATE POLICY gifts_insert_policy ON gifts
    FOR INSERT
    WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY gifts_update_policy ON gifts
    FOR UPDATE
    USING (organization_id = get_current_organization_id());

CREATE POLICY gifts_delete_policy ON gifts
    FOR DELETE
    USING (organization_id = get_current_organization_id());

-- Shifts: Isolated by organization
CREATE POLICY shifts_select_policy ON shifts
    FOR SELECT
    USING (organization_id = get_current_organization_id());

CREATE POLICY shifts_insert_policy ON shifts
    FOR INSERT
    WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY shifts_update_policy ON shifts
    FOR UPDATE
    USING (organization_id = get_current_organization_id());

CREATE POLICY shifts_delete_policy ON shifts
    FOR DELETE
    USING (organization_id = get_current_organization_id());

-- Shift Signups: Isolated by organization through shift relationship
CREATE POLICY shift_signups_select_policy ON shift_signups
    FOR SELECT
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id = get_current_organization_id()
        )
    );

CREATE POLICY shift_signups_insert_policy ON shift_signups
    FOR INSERT
    WITH CHECK (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id = get_current_organization_id()
        )
    );

CREATE POLICY shift_signups_update_policy ON shift_signups
    FOR UPDATE
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id = get_current_organization_id()
        )
    );

CREATE POLICY shift_signups_delete_policy ON shift_signups
    FOR DELETE
    USING (
        shift_id IN (
            SELECT id FROM shifts WHERE organization_id = get_current_organization_id()
        )
    );

-- Email Drafts: Isolated by organization
CREATE POLICY email_drafts_select_policy ON email_drafts
    FOR SELECT
    USING (organization_id = get_current_organization_id());

CREATE POLICY email_drafts_insert_policy ON email_drafts
    FOR INSERT
    WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY email_drafts_update_policy ON email_drafts
    FOR UPDATE
    USING (organization_id = get_current_organization_id());

CREATE POLICY email_drafts_delete_policy ON email_drafts
    FOR DELETE
    USING (organization_id = get_current_organization_id());

-- Activities: Isolated by organization
CREATE POLICY activities_select_policy ON activities
    FOR SELECT
    USING (organization_id = get_current_organization_id());

CREATE POLICY activities_insert_policy ON activities
    FOR INSERT
    WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY activities_update_policy ON activities
    FOR UPDATE
    USING (organization_id = get_current_organization_id());

CREATE POLICY activities_delete_policy ON activities
    FOR DELETE
    USING (organization_id = get_current_organization_id());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on contacts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to update contact donor stats after gift insert/update/delete
CREATE OR REPLACE FUNCTION update_contact_donor_stats()
RETURNS TRIGGER AS $$
DECLARE
    contact_rec RECORD;
BEGIN
    -- Get the contact_id from the appropriate record
    IF TG_OP = 'DELETE' THEN
        SELECT
            OLD.contact_id as id,
            COALESCE(SUM(g.amount), 0) as lifetime_giving,
            COUNT(*) as total_gifts,
            MAX(g.gift_date) as last_gift_date
        INTO contact_rec
        FROM gifts g
        WHERE g.contact_id = OLD.contact_id
        GROUP BY g.contact_id;
    ELSE
        SELECT
            NEW.contact_id as id,
            COALESCE(SUM(g.amount), 0) as lifetime_giving,
            COUNT(*) as total_gifts,
            MAX(g.gift_date) as last_gift_date
        INTO contact_rec
        FROM gifts g
        WHERE g.contact_id = NEW.contact_id
        GROUP BY g.contact_id;
    END IF;

    -- Update the contact
    IF contact_rec.id IS NOT NULL THEN
        UPDATE contacts
        SET
            is_donor = TRUE,
            lifetime_giving = COALESCE(contact_rec.lifetime_giving, 0),
            total_gifts = COALESCE(contact_rec.total_gifts, 0),
            last_gift_date = contact_rec.last_gift_date
        WHERE id = contact_rec.id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gifts_update_contact_stats
    AFTER INSERT OR UPDATE OR DELETE ON gifts
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_donor_stats();

-- Function to update contact volunteer stats after shift signup completion
CREATE OR REPLACE FUNCTION update_contact_volunteer_stats()
RETURNS TRIGGER AS $$
DECLARE
    contact_rec RECORD;
    total_hours DECIMAL(10,2);
    total_signups INTEGER;
    no_show_count INTEGER;
    reliability DECIMAL(3,2);
BEGIN
    -- Only update stats when a signup is completed with hours logged
    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND NEW.status = 'completed' AND NEW.hours_logged IS NOT NULL THEN
        -- Calculate stats for this contact
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN no_show = TRUE THEN 1 ELSE 0 END) as no_shows,
            SUM(COALESCE(hours_logged, 0)) as hours
        INTO total_signups, no_show_count, total_hours
        FROM shift_signups
        WHERE contact_id = NEW.contact_id
            AND status = 'completed';

        -- Calculate reliability score (completed without no-show / total completed)
        IF total_signups > 0 THEN
            reliability := LEAST(1.0, (total_signups - no_show_count)::DECIMAL / total_signups);
        ELSE
            reliability := 1.0;
        END IF;

        -- Update the contact
        UPDATE contacts
        SET
            is_volunteer = TRUE,
            total_volunteer_hours = COALESCE(total_hours, 0),
            reliability_score = reliability
        WHERE id = NEW.contact_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shift_signups_update_contact_stats
    AFTER INSERT OR UPDATE ON shift_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_volunteer_stats();
