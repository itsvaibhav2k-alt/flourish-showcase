-- ============================================================================
-- SEED DATA FOR FLOURISH NONPROFIT CRM
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE email_drafts CASCADE;
TRUNCATE TABLE shift_signups CASCADE;
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE gifts CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE organization_members CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (id, name, slug, settings, voice_samples, voice_summary, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Nonprofit',
    'demo-nonprofit',
    '{
        "timezone": "America/New_York",
        "currency": "USD",
        "fiscal_year_start": "01-01",
        "email_from_name": "Demo Nonprofit",
        "email_from_address": "hello@demononprofit.org"
    }'::jsonb,
    ARRAY[
        'Thank you so much for your generous donation!',
        'We are grateful for your continued support.',
        'Your contribution makes a real difference in our community.'
    ],
    'Warm, appreciative tone with emphasis on community impact and personal connection.',
    NOW() - INTERVAL '6 months'
);

-- ============================================================================
-- CONTACTS
-- ============================================================================

-- Donor contacts
INSERT INTO contacts (id, organization_id, first_name, last_name, email, phone, address, tags, is_donor, is_volunteer, lifetime_giving, total_gifts, last_gift_date, lapse_risk, created_at)
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Sarah',
    'Johnson',
    'sarah.johnson@email.com',
    '555-0101',
    '{
        "street": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "zip": "62701"
    }'::jsonb,
    ARRAY['major-donor', 'board-prospect'],
    TRUE,
    FALSE,
    15000.00,
    12,
    NOW() - INTERVAL '15 days',
    'low',
    NOW() - INTERVAL '2 years'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Michael',
    'Chen',
    'michael.chen@email.com',
    '555-0102',
    '{
        "street": "456 Oak Ave",
        "city": "Springfield",
        "state": "IL",
        "zip": "62702"
    }'::jsonb,
    ARRAY['recurring-donor', 'event-attendee'],
    TRUE,
    TRUE,
    3600.00,
    24,
    NOW() - INTERVAL '30 days',
    'low',
    NOW() - INTERVAL '3 years'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Emily',
    'Rodriguez',
    'emily.rodriguez@email.com',
    '555-0103',
    '{
        "street": "789 Elm St",
        "city": "Springfield",
        "state": "IL",
        "zip": "62703"
    }'::jsonb,
    ARRAY['lapsed-donor'],
    TRUE,
    FALSE,
    800.00,
    4,
    NOW() - INTERVAL '18 months',
    'high',
    NOW() - INTERVAL '4 years'
),
-- Volunteer contacts
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'David',
    'Thompson',
    'david.thompson@email.com',
    '555-0104',
    '{
        "street": "321 Pine St",
        "city": "Springfield",
        "state": "IL",
        "zip": "62704"
    }'::jsonb,
    ARRAY['volunteer', 'reliable'],
    FALSE,
    TRUE,
    0.00,
    0,
    NULL,
    NULL,
    NOW() - INTERVAL '1 year'
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Jessica',
    'Martinez',
    'jessica.martinez@email.com',
    '555-0105',
    '{
        "street": "654 Maple Dr",
        "city": "Springfield",
        "state": "IL",
        "zip": "62705"
    }'::jsonb,
    ARRAY['volunteer', 'team-leader'],
    TRUE,
    TRUE,
    1200.00,
    8,
    NOW() - INTERVAL '45 days',
    'medium',
    NOW() - INTERVAL '18 months'
),
-- New contact (no giving or volunteer history yet)
(
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Robert',
    'Kim',
    'robert.kim@email.com',
    '555-0106',
    '{
        "street": "987 Cedar Ln",
        "city": "Springfield",
        "state": "IL",
        "zip": "62706"
    }'::jsonb,
    ARRAY['new-contact', 'newsletter-subscriber'],
    FALSE,
    FALSE,
    0.00,
    0,
    NULL,
    NULL,
    NOW() - INTERVAL '7 days'
);

-- ============================================================================
-- GIFTS
-- ============================================================================

-- Sarah Johnson's gifts (major donor)
INSERT INTO gifts (id, organization_id, contact_id, amount, gift_date, gift_type, campaign, payment_method, notes, thanked_at, created_at)
VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    5000.00,
    NOW() - INTERVAL '15 days',
    'one-time',
    'Annual Gala 2024',
    'credit_card',
    'Table sponsor for annual gala',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '15 days'
),
(
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    2500.00,
    NOW() - INTERVAL '6 months',
    'one-time',
    'Spring Appeal 2024',
    'check',
    NULL,
    NOW() - INTERVAL '6 months' + INTERVAL '2 days',
    NOW() - INTERVAL '6 months'
),
-- Michael Chen's recurring gifts
(
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    150.00,
    NOW() - INTERVAL '30 days',
    'recurring',
    'Monthly Giving Program',
    'credit_card',
    'Automatic monthly donation',
    NOW() - INTERVAL '29 days',
    NOW() - INTERVAL '30 days'
),
(
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    150.00,
    NOW() - INTERVAL '60 days',
    'recurring',
    'Monthly Giving Program',
    'credit_card',
    'Automatic monthly donation',
    NOW() - INTERVAL '59 days',
    NOW() - INTERVAL '60 days'
),
-- Emily Rodriguez's older gifts (lapsed)
(
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    250.00,
    NOW() - INTERVAL '18 months',
    'one-time',
    'Year-End 2023',
    'check',
    NULL,
    NOW() - INTERVAL '18 months' + INTERVAL '3 days',
    NOW() - INTERVAL '18 months'
),
-- Jessica Martinez's gifts
(
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    300.00,
    NOW() - INTERVAL '45 days',
    'one-time',
    'Summer Drive 2024',
    'credit_card',
    NULL,
    NOW() - INTERVAL '44 days',
    NOW() - INTERVAL '45 days'
);

-- ============================================================================
-- SHIFTS
-- ============================================================================

-- Upcoming shifts
INSERT INTO shifts (id, organization_id, title, description, location, start_time, end_time, capacity, status, created_at)
VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Food Bank Sorting',
    'Help sort and organize donated food items for distribution',
    'Main Warehouse, 100 Distribution Way',
    NOW() + INTERVAL '3 days' + INTERVAL '9 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '12 hours',
    10,
    'open',
    NOW() - INTERVAL '14 days'
),
(
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Community Garden Cleanup',
    'Spring cleanup and preparation for planting season',
    'Community Garden, 555 Green Street',
    NOW() + INTERVAL '7 days' + INTERVAL '8 hours',
    NOW() + INTERVAL '7 days' + INTERVAL '11 hours',
    15,
    'open',
    NOW() - INTERVAL '7 days'
),
-- Past completed shift
(
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Holiday Gift Wrapping',
    'Wrap gifts for families in need',
    'Community Center, 200 Main Street',
    NOW() - INTERVAL '30 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '30 days' + INTERVAL '14 hours',
    8,
    'completed',
    NOW() - INTERVAL '45 days'
);

-- ============================================================================
-- SHIFT SIGNUPS
-- ============================================================================

-- Signups for upcoming shifts
INSERT INTO shift_signups (id, shift_id, contact_id, status, confirmation_sent, reminder_1_sent, created_at)
VALUES
(
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'confirmed',
    TRUE,
    FALSE,
    NOW() - INTERVAL '10 days'
),
(
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'confirmed',
    TRUE,
    FALSE,
    NOW() - INTERVAL '8 days'
),
(
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'confirmed',
    TRUE,
    FALSE,
    NOW() - INTERVAL '5 days'
),
-- Completed past shift signups
(
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    'completed',
    TRUE,
    TRUE,
    NOW() - INTERVAL '40 days'
),
(
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    'completed',
    TRUE,
    TRUE,
    NOW() - INTERVAL '38 days'
);

-- Update completed signups with hours logged
UPDATE shift_signups
SET
    checked_in_at = NOW() - INTERVAL '30 days' + INTERVAL '10 hours',
    hours_logged = 4.0,
    no_show = FALSE,
    thank_you_sent = TRUE
WHERE id IN (
    '40000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000005'
);

-- ============================================================================
-- EMAIL DRAFTS
-- ============================================================================

-- Draft thank you emails
INSERT INTO email_drafts (id, organization_id, contact_id, email_type, trigger_event, trigger_event_id, subject, body, model_used, prompt_version, context_snapshot, status, created_at)
VALUES
(
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'thank_you',
    'gift_received',
    '20000000-0000-0000-0000-000000000001',
    'Thank You for Your Generous Support',
    'Dear Sarah,

Thank you so much for your generous $5,000 donation to our Annual Gala 2024! Your table sponsorship will help us continue our mission to serve our community.

Your contribution makes a real difference, and we are grateful for your continued support.

With appreciation,
Demo Nonprofit Team',
    'claude-3-5-sonnet-20241022',
    'v1.0',
    '{
        "gift_amount": 5000.00,
        "gift_type": "one-time",
        "campaign": "Annual Gala 2024",
        "donor_history": "major donor, 12 previous gifts"
    }'::jsonb,
    'sent',
    NOW() - INTERVAL '14 days'
),
(
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'thank_you',
    'gift_received',
    '20000000-0000-0000-0000-000000000003',
    'Your Monthly Gift is Making a Difference',
    'Dear Michael,

Thank you for your continued monthly support! Your $150 donation this month helps us maintain our programs year-round.

We are grateful for donors like you who make sustained impact possible.

Warmly,
Demo Nonprofit Team',
    'claude-3-5-sonnet-20241022',
    'v1.0',
    '{
        "gift_amount": 150.00,
        "gift_type": "recurring",
        "campaign": "Monthly Giving Program",
        "donor_history": "recurring donor, 24 previous gifts"
    }'::jsonb,
    'sent',
    NOW() - INTERVAL '29 days'
),
(
    '50000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'confirmation',
    'shift_signup',
    '40000000-0000-0000-0000-000000000001',
    'Confirmed: Food Bank Sorting Volunteer Shift',
    'Hi David,

This confirms your volunteer shift for Food Bank Sorting on ' || to_char(NOW() + INTERVAL '3 days', 'FMDay, FMMonth DD') || ' from 9:00 AM to 12:00 PM.

Location: Main Warehouse, 100 Distribution Way

We look forward to seeing you there!

Best,
Demo Nonprofit Volunteer Team',
    'claude-3-5-sonnet-20241022',
    'v1.0',
    '{
        "shift_title": "Food Bank Sorting",
        "shift_date": "upcoming",
        "volunteer_history": "reliable volunteer"
    }'::jsonb,
    'sent',
    NOW() - INTERVAL '10 days'
);

-- ============================================================================
-- ACTIVITIES
-- ============================================================================

-- Log recent activities
INSERT INTO activities (id, organization_id, contact_id, activity_type, description, metadata, created_at)
VALUES
(
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'gift',
    'Donated $5,000 to Annual Gala 2024',
    '{
        "gift_id": "20000000-0000-0000-0000-000000000001",
        "amount": 5000.00,
        "campaign": "Annual Gala 2024"
    }'::jsonb,
    NOW() - INTERVAL '15 days'
),
(
    '60000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'email_sent',
    'Sent thank you email for recent gift',
    '{
        "email_draft_id": "50000000-0000-0000-0000-000000000001",
        "email_type": "thank_you"
    }'::jsonb,
    NOW() - INTERVAL '14 days'
),
(
    '60000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'shift_signup',
    'Signed up for Food Bank Sorting shift',
    '{
        "shift_id": "30000000-0000-0000-0000-000000000001",
        "shift_title": "Food Bank Sorting"
    }'::jsonb,
    NOW() - INTERVAL '10 days'
),
(
    '60000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'shift_completed',
    'Completed Holiday Gift Wrapping shift (4 hours)',
    '{
        "shift_id": "30000000-0000-0000-0000-000000000003",
        "shift_title": "Holiday Gift Wrapping",
        "hours_logged": 4.0
    }'::jsonb,
    NOW() - INTERVAL '30 days'
),
(
    '60000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000006',
    'contact_created',
    'New contact added to system',
    '{
        "source": "newsletter_signup"
    }'::jsonb,
    NOW() - INTERVAL '7 days'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Display summary of seeded data
DO $$
DECLARE
    org_count INTEGER;
    contact_count INTEGER;
    gift_count INTEGER;
    shift_count INTEGER;
    signup_count INTEGER;
    email_count INTEGER;
    activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO contact_count FROM contacts;
    SELECT COUNT(*) INTO gift_count FROM gifts;
    SELECT COUNT(*) INTO shift_count FROM shifts;
    SELECT COUNT(*) INTO signup_count FROM shift_signups;
    SELECT COUNT(*) INTO email_count FROM email_drafts;
    SELECT COUNT(*) INTO activity_count FROM activities;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SEED DATA SUMMARY';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Contacts: %', contact_count;
    RAISE NOTICE 'Gifts: %', gift_count;
    RAISE NOTICE 'Shifts: %', shift_count;
    RAISE NOTICE 'Shift Signups: %', signup_count;
    RAISE NOTICE 'Email Drafts: %', email_count;
    RAISE NOTICE 'Activities: %', activity_count;
    RAISE NOTICE '===========================================';
END $$;
