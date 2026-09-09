import { requireEnv } from './env.mjs'

const {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  SEED_USER_EMAIL,
  SEED_USER_PASSWORD,
} = requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SEED_USER_EMAIL', 'SEED_USER_PASSWORD')
const { createClient } = await import('@supabase/supabase-js')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('Starting seed...')

  // Create organization
  const orgId = '4c6d90d8-55fe-428b-a6e1-1ddc9853a08b'
  const { error: orgError } = await supabase
    .from('organizations')
    .upsert({
      id: orgId,
      name: 'Flourish Test Org',
      slug: 'flourish-test-org',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (orgError) {
    console.error('Org error:', orgError)
    return
  }
  console.log('Organization created')

  // Create user if not exists
  const userId = '9de8be6a-86d1-4748-8049-ad1ef093ba83'
  const { data: existingUser } = await supabase.auth.admin.getUserById(userId)

  if (!existingUser?.user) {
    const { error: userError } = await supabase.auth.admin.createUser({
      email: SEED_USER_EMAIL,
      password: SEED_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Vaibhav' }
    })
    if (userError) console.error('User error:', userError)
    else console.log('User created')
  }

  // Get the actual user ID
  const { data: users } = await supabase.auth.admin.listUsers()
  const testUser = users?.users?.find(u => u.email === SEED_USER_EMAIL)
  const actualUserId = testUser?.id

  if (!actualUserId) {
    console.error('Could not find or create user')
    return
  }

  // Create organization member
  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({
      user_id: actualUserId,
      organization_id: orgId,
      role: 'admin',
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,organization_id' })

  if (memberError) console.error('Member error:', memberError)
  else console.log('Organization member created')

  // Create contacts
  const contacts = [
    { id: '1929de33-054f-4fd6-b9ee-ce2016e75d3d', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com', is_donor: true, is_volunteer: false },
    { id: '99669460-6c6f-489e-8151-c63d29786f74', first_name: 'Michael', last_name: 'Chen', email: 'michael@example.com', is_donor: true, is_volunteer: true },
    { id: 'd0a107f1-c059-4793-8c61-4dee137619ab', first_name: 'Emily', last_name: 'Davis', email: 'emily@example.com', is_donor: false, is_volunteer: true },
    { id: 'cfb4de11-9aef-4a0d-9505-85986efd91ed', first_name: 'Ashley', last_name: 'Martinez', email: 'ashley@example.com', is_donor: true, is_volunteer: false },
    { id: 'e9a14113-5635-4002-9f64-42ae375d67ec', first_name: 'David', last_name: 'Wilson', email: 'david@example.com', is_donor: true, is_volunteer: true },
    { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', first_name: 'Jennifer', last_name: 'Brown', email: 'jennifer@example.com', is_donor: true, is_volunteer: false, lapse_risk: 'high' },
    { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', first_name: 'Robert', last_name: 'Taylor', email: 'robert@example.com', is_donor: true, is_volunteer: false, lapse_risk: 'medium' },
    { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', first_name: 'Amanda', last_name: 'Anderson', email: 'amanda@example.com', is_donor: false, is_volunteer: true },
    { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', first_name: 'Christopher', last_name: 'Thomas', email: 'chris@example.com', is_donor: true, is_volunteer: true },
    { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', first_name: 'Jessica', last_name: 'White', email: 'jessica@example.com', is_donor: true, is_volunteer: false }
  ].map(c => ({ ...c, organization_id: orgId, created_at: new Date().toISOString() }))

  const { error: contactsError } = await supabase.from('contacts').upsert(contacts, { onConflict: 'id' })
  if (contactsError) console.error('Contacts error:', contactsError)
  else console.log('10 contacts created')

  // Create gifts
  const now = new Date()
  const gifts = [
    { contact_id: contacts[0].id, amount: 100, gift_date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[1].id, amount: 500, gift_date: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[3].id, amount: 200, gift_date: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[4].id, amount: 1000, gift_date: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[5].id, amount: 250, gift_date: new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[6].id, amount: 75, gift_date: new Date(now - 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[8].id, amount: 150, gift_date: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'recurring' },
    { contact_id: contacts[9].id, amount: 300, gift_date: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' },
    { contact_id: contacts[0].id, amount: 50, gift_date: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], gift_type: 'one-time' }
  ].map(g => ({ ...g, organization_id: orgId }))

  const { error: giftsError } = await supabase.from('gifts').insert(gifts)
  if (giftsError) console.error('Gifts error:', giftsError)
  else console.log('9 gifts created')

  // Create shifts (upcoming)
  const shiftIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  ]
  const shifts = [
    { id: shiftIds[0], title: 'Food Bank Sorting', start_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), capacity: 10, location: 'Main Warehouse' },
    { id: shiftIds[1], title: 'Community Garden Workday', start_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), capacity: 8, location: 'Community Garden' },
    { id: shiftIds[2], title: 'Youth Mentoring', start_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), capacity: 5, location: 'Youth Center' },
    { id: shiftIds[3], title: 'Donation Drive', start_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), end_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), capacity: 15, location: 'Shopping Center' }
  ].map(s => ({ ...s, organization_id: orgId }))

  const { error: shiftsError } = await supabase.from('shifts').upsert(shifts, { onConflict: 'id' })
  if (shiftsError) console.error('Shifts error:', shiftsError)
  else console.log('4 shifts created')

  // Create shift signups (no organization_id column in this table)
  const signups = [
    { shift_id: shiftIds[0], contact_id: contacts[1].id, status: 'confirmed' },
    { shift_id: shiftIds[0], contact_id: contacts[2].id, status: 'confirmed' },
    { shift_id: shiftIds[0], contact_id: contacts[7].id, status: 'confirmed' },
    { shift_id: shiftIds[1], contact_id: contacts[2].id, status: 'confirmed' },
    { shift_id: shiftIds[1], contact_id: contacts[4].id, status: 'confirmed' },
    { shift_id: shiftIds[2], contact_id: contacts[1].id, status: 'confirmed' },
    { shift_id: shiftIds[3], contact_id: contacts[2].id, status: 'confirmed' },
    { shift_id: shiftIds[3], contact_id: contacts[4].id, status: 'confirmed' },
    { shift_id: shiftIds[3], contact_id: contacts[7].id, status: 'confirmed' },
    { shift_id: shiftIds[3], contact_id: contacts[8].id, status: 'confirmed' }
  ]

  const { error: signupsError } = await supabase.from('shift_signups').insert(signups)
  if (signupsError) console.error('Signups error:', signupsError)
  else console.log('10 shift signups created')

  // Create email drafts
  const drafts = [
    { contact_id: contacts[0].id, email_type: 'thank_you', subject: 'Thank you for your generous gift', body: 'Dear Sarah, Thank you so much for your generous gift of $100. With gratitude, The Team', status: 'draft', trigger_event: 'gift_received' },
    { contact_id: contacts[1].id, email_type: 'thank_you', subject: 'Your support makes a difference', body: 'Hi Michael, We are incredibly grateful for your donation of $500. Thank you! The Team', status: 'draft', trigger_event: 'gift_received' },
    { contact_id: contacts[3].id, email_type: 'thank_you', subject: 'Grateful for your contribution', body: 'Dear Ashley, Thank you for your gift of $200. With appreciation, The Team', status: 'draft', trigger_event: 'gift_received' },
    { contact_id: contacts[2].id, email_type: 'confirmation', subject: 'Confirmed: Your volunteer shift', body: 'Hi Emily, This confirms your registration for Community Garden Workday. See you soon! The Team', status: 'reviewed', trigger_event: 'shift_signup' },
    { contact_id: contacts[4].id, email_type: 'follow_up', subject: 'We hope to see you again soon', body: 'Hi David, It was wonderful to have you volunteer with us recently. Best, The Team', status: 'draft', trigger_event: 'shift_completed' }
  ].map(d => ({ ...d, organization_id: orgId, model_used: 'claude-3-5-sonnet-20241022', prompt_version: 'v1.0', context_snapshot: {} }))

  const { error: draftsError } = await supabase.from('email_drafts').insert(drafts)
  if (draftsError) console.error('Drafts error:', draftsError)
  else console.log('5 email drafts created')

  // Create activities
  const activities = [
    { contact_id: contacts[0].id, activity_type: 'gift', description: 'donated $100', metadata: { amount: 100 } },
    { contact_id: contacts[1].id, activity_type: 'gift', description: 'donated $500', metadata: { amount: 500 } },
    { contact_id: contacts[2].id, activity_type: 'note_added', description: 'added a note', metadata: { note: 'Great conversation about upcoming events' } },
    { contact_id: contacts[3].id, activity_type: 'gift', description: 'donated $200', metadata: { amount: 200 } },
    { contact_id: contacts[4].id, activity_type: 'email_sent', description: 'received an email', metadata: { subject: 'Thank you for volunteering' } },
    { contact_id: contacts[0].id, activity_type: 'note_added', description: 'added a note', metadata: { note: 'Interested in monthly giving program' } }
  ].map(a => ({ ...a, organization_id: orgId }))

  const { error: activitiesError } = await supabase.from('activities').insert(activities)
  if (activitiesError) console.error('Activities error:', activitiesError)
  else console.log('6 activities created')

  console.log('\nSeed completed! Summary:')
  console.log('- 1 organization')
  console.log('- 1 user with organization membership')
  console.log('- 10 contacts (6 donors, 5 volunteers)')
  console.log('- 9 gifts (2 lapsed donors)')
  console.log('- 4 upcoming shifts')
  console.log('- 10 shift signups')
  console.log('- 5 email drafts (4 pending, 1 reviewed)')
  console.log('- 6 activities')
}

seed().catch(console.error)
