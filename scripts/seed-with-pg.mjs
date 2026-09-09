import { requireEnv } from './env.mjs'

const { DATABASE_URL, SEED_USER_EMAIL, SEED_USER_PASSWORD } = requireEnv(
  'DATABASE_URL',
  'SEED_USER_EMAIL',
  'SEED_USER_PASSWORD',
)

const { default: pg } = await import('pg')
const { Pool } = pg

const pool = new Pool({ connectionString: DATABASE_URL })

async function seed() {
  const client = await pool.connect()

  try {
    console.log('Starting seed with direct Postgres connection...')

    // Start transaction
    await client.query('BEGIN')

    const orgId = '4c6d90d8-55fe-428b-a6e1-1ddc9853a08b'
    const now = new Date()

    // Create organization
    await client.query(`
      INSERT INTO organizations (id, name, slug, created_at)
      VALUES ($1, 'Flourish Test Org', 'flourish-test-org', NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'Flourish Test Org'
    `, [orgId])
    console.log('Organization created')

    // Check if user exists, create if not
    let userResult = await client.query('SELECT id FROM auth.users WHERE email = $1', [SEED_USER_EMAIL])
    let userId = userResult.rows[0]?.id

    if (!userId) {
      userResult = await client.query(`
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, aud, role)
        VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(), '', 'authenticated', 'authenticated')
        RETURNING id
      `, [SEED_USER_EMAIL, SEED_USER_PASSWORD])
      userId = userResult.rows[0]?.id
      console.log('User created:', userId)
    } else {
      console.log('User already exists:', userId)
    }

    // Create organization member
    if (userId) {
      await client.query(`
        INSERT INTO organization_members (organization_id, user_id, role, created_at)
        VALUES ($1, $2, 'admin', NOW())
        ON CONFLICT (organization_id, user_id) DO NOTHING
      `, [orgId, userId])
      console.log('Organization member created')
    }

    // Create contacts
    const contacts = [
      ['1929de33-054f-4fd6-b9ee-ce2016e75d3d', 'Sarah', 'Johnson', 'sarah@example.com', true, false, null],
      ['99669460-6c6f-489e-8151-c63d29786f74', 'Michael', 'Chen', 'michael@example.com', true, true, null],
      ['d0a107f1-c059-4793-8c61-4dee137619ab', 'Emily', 'Davis', 'emily@example.com', false, true, null],
      ['cfb4de11-9aef-4a0d-9505-85986efd91ed', 'Ashley', 'Martinez', 'ashley@example.com', true, false, null],
      ['e9a14113-5635-4002-9f64-42ae375d67ec', 'David', 'Wilson', 'david@example.com', true, true, null],
      ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jennifer', 'Brown', 'jennifer@example.com', true, false, 'high'],
      ['b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Robert', 'Taylor', 'robert@example.com', true, false, 'medium'],
      ['c3d4e5f6-a7b8-9012-cdef-123456789012', 'Amanda', 'Anderson', 'amanda@example.com', false, true, null],
      ['d4e5f6a7-b8c9-0123-defa-234567890123', 'Christopher', 'Thomas', 'chris@example.com', true, true, null],
      ['e5f6a7b8-c9d0-1234-efab-345678901234', 'Jessica', 'White', 'jessica@example.com', true, false, null]
    ]

    for (const c of contacts) {
      await client.query(`
        INSERT INTO contacts (id, organization_id, first_name, last_name, email, is_donor, is_volunteer, lapse_risk, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET first_name = $3, last_name = $4
      `, [c[0], orgId, c[1], c[2], c[3], c[4], c[5], c[6]])
    }
    console.log('10 contacts created')

    // Create gifts
    const gifts = [
      [contacts[0][0], 100, new Date(now - 5 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[1][0], 500, new Date(now - 10 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[3][0], 200, new Date(now - 15 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[4][0], 1000, new Date(now - 30 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[5][0], 250, new Date(now - 400 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[6][0], 75, new Date(now - 300 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[8][0], 150, new Date(now - 20 * 24 * 60 * 60 * 1000), 'recurring'],
      [contacts[9][0], 300, new Date(now - 60 * 24 * 60 * 60 * 1000), 'one-time'],
      [contacts[0][0], 50, new Date(now - 90 * 24 * 60 * 60 * 1000), 'one-time']
    ]

    for (const g of gifts) {
      await client.query(`
        INSERT INTO gifts (organization_id, contact_id, amount, gift_date, gift_type, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [orgId, g[0], g[1], g[2], g[3]])
    }
    console.log('9 gifts created')

    // Create shifts
    const shiftIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444'
    ]
    const shifts = [
      [shiftIds[0], 'Food Bank Sorting', new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), 10, 'Main Warehouse'],
      [shiftIds[1], 'Community Garden Workday', new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), 8, 'Community Garden'],
      [shiftIds[2], 'Youth Mentoring', new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), 5, 'Youth Center'],
      [shiftIds[3], 'Donation Drive', new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), 15, 'Shopping Center']
    ]

    for (const s of shifts) {
      await client.query(`
        INSERT INTO shifts (id, organization_id, title, start_time, end_time, capacity, location, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET title = $3
      `, [s[0], orgId, s[1], s[2], s[3], s[4], s[5]])
    }
    console.log('4 shifts created')

    // Create shift signups
    const signups = [
      [shiftIds[0], contacts[1][0]],
      [shiftIds[0], contacts[2][0]],
      [shiftIds[0], contacts[7][0]],
      [shiftIds[1], contacts[2][0]],
      [shiftIds[1], contacts[4][0]],
      [shiftIds[2], contacts[1][0]],
      [shiftIds[3], contacts[2][0]],
      [shiftIds[3], contacts[4][0]],
      [shiftIds[3], contacts[7][0]],
      [shiftIds[3], contacts[8][0]]
    ]

    for (const s of signups) {
      await client.query(`
        INSERT INTO shift_signups (shift_id, contact_id, status, created_at)
        VALUES ($1, $2, 'confirmed', NOW())
        ON CONFLICT (shift_id, contact_id) DO NOTHING
      `, [s[0], s[1]])
    }
    console.log('10 shift signups created')

    // Create email drafts
    const drafts = [
      [contacts[0][0], 'thank_you', 'Thank you for your generous gift', 'Dear Sarah, Thank you so much for your generous gift of $100. With gratitude, The Team', 'draft', 'gift_received'],
      [contacts[1][0], 'thank_you', 'Your support makes a difference', 'Hi Michael, We are incredibly grateful for your donation of $500. Thank you! The Team', 'draft', 'gift_received'],
      [contacts[3][0], 'thank_you', 'Grateful for your contribution', 'Dear Ashley, Thank you for your gift of $200. With appreciation, The Team', 'draft', 'gift_received'],
      [contacts[2][0], 'confirmation', 'Confirmed: Your volunteer shift', 'Hi Emily, This confirms your registration for Community Garden Workday. See you soon! The Team', 'reviewed', 'shift_signup'],
      [contacts[4][0], 'follow_up', 'We hope to see you again soon', 'Hi David, It was wonderful to have you volunteer with us recently. Best, The Team', 'draft', 'shift_completed']
    ]

    for (const d of drafts) {
      await client.query(`
        INSERT INTO email_drafts (organization_id, contact_id, email_type, subject, body, status, trigger_event, model_used, prompt_version, context_snapshot, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'claude-3-5-sonnet-20241022', 'v1.0', '{}', NOW())
      `, [orgId, d[0], d[1], d[2], d[3], d[4], d[5]])
    }
    console.log('5 email drafts created')

    // Create activities
    const activities = [
      [contacts[0][0], 'gift', 'donated $100', { amount: 100 }],
      [contacts[1][0], 'gift', 'donated $500', { amount: 500 }],
      [contacts[2][0], 'note_added', 'added a note', { note: 'Great conversation about upcoming events' }],
      [contacts[3][0], 'gift', 'donated $200', { amount: 200 }],
      [contacts[4][0], 'email_sent', 'received an email', { subject: 'Thank you for volunteering' }],
      [contacts[0][0], 'note_added', 'added a note', { note: 'Interested in monthly giving program' }]
    ]

    for (const a of activities) {
      await client.query(`
        INSERT INTO activities (organization_id, contact_id, activity_type, description, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [orgId, a[0], a[1], a[2], JSON.stringify(a[3])])
    }
    console.log('6 activities created')

    // Commit transaction
    await client.query('COMMIT')

    // Verify data
    const contactCount = await client.query('SELECT COUNT(*) FROM contacts WHERE organization_id = $1', [orgId])
    const giftCount = await client.query('SELECT COUNT(*) FROM gifts WHERE organization_id = $1', [orgId])
    const shiftCount = await client.query('SELECT COUNT(*) FROM shifts WHERE organization_id = $1', [orgId])
    const draftCount = await client.query('SELECT COUNT(*) FROM email_drafts WHERE organization_id = $1', [orgId])
    const activityCount = await client.query('SELECT COUNT(*) FROM activities WHERE organization_id = $1', [orgId])

    console.log('\nData verification:')
    console.log('- Contacts:', contactCount.rows[0].count)
    console.log('- Gifts:', giftCount.rows[0].count)
    console.log('- Shifts:', shiftCount.rows[0].count)
    console.log('- Email drafts:', draftCount.rows[0].count)
    console.log('- Activities:', activityCount.rows[0].count)

    console.log('\nSeed completed successfully!')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(console.error)
