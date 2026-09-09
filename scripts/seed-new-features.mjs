import { requireEnv } from './env.mjs'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
)
const { createClient } = await import('@supabase/supabase-js')

const supabase = createClient(supabaseUrl, supabaseKey)

// Real organization ID from production
const orgId = '038d0696-9254-4a4f-a6b2-7741dcb594d3'

async function seedContacts() {
  console.log('\n=== Creating Test Contacts ===')

  const contacts = [
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '555-0101',
      is_donor: true,
      is_volunteer: false,
      organization_id: orgId
    },
    {
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@example.com',
      phone: '555-0102',
      is_donor: true,
      is_volunteer: true,
      organization_id: orgId
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@example.com',
      phone: '555-0103',
      is_donor: false,
      is_volunteer: true,
      organization_id: orgId
    },
    {
      first_name: 'David',
      last_name: 'Wilson',
      email: 'david.wilson@example.com',
      phone: '555-0104',
      is_donor: true,
      is_volunteer: true,
      organization_id: orgId
    },
    {
      first_name: 'Jennifer',
      last_name: 'Brown',
      email: 'jennifer.brown@example.com',
      phone: '555-0105',
      is_donor: true,
      is_volunteer: false,
      lapse_risk: 'high',
      organization_id: orgId
    },
    {
      first_name: 'Robert',
      last_name: 'Taylor',
      email: 'robert.taylor@example.com',
      phone: '555-0106',
      is_donor: true,
      is_volunteer: false,
      lapse_risk: 'medium',
      organization_id: orgId
    },
    {
      first_name: 'Amanda',
      last_name: 'Martinez',
      email: 'amanda.martinez@example.com',
      phone: '555-0107',
      is_donor: true,
      is_volunteer: true,
      organization_id: orgId
    },
    {
      first_name: 'Christopher',
      last_name: 'Thomas',
      email: 'chris.thomas@example.com',
      phone: '555-0108',
      is_donor: true,
      is_volunteer: true,
      organization_id: orgId
    }
  ]

  const insertedContacts = []

  for (const contact of contacts) {
    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('email', contact.email)
      .eq('organization_id', orgId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`Contact ${contact.email} already exists, skipping`)
      insertedContacts.push(existing[0])
      continue
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()

    if (error) {
      console.error('Error inserting contact:', contact.email, error.message)
    } else if (data) {
      insertedContacts.push(data[0])
      console.log(`Created contact: ${contact.first_name} ${contact.last_name}`)
    }
  }

  // Get all contacts including any that already existed
  const { data: allContacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .eq('organization_id', orgId)

  console.log(`Now have ${allContacts?.length || 0} contacts in database`)
  return allContacts || []
}

async function seedGifts(contacts) {
  console.log('\n=== Creating Test Gifts ===')

  const now = Date.now()
  const gifts = []

  // Sarah Johnson - steady donor
  const sarah = contacts.find(c => c.first_name === 'Sarah')
  if (sarah) {
    gifts.push(
      { contact_id: sarah.id, amount: 100, gift_date: new Date(now - 5 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: sarah.id, amount: 50, gift_date: new Date(now - 90 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: sarah.id, amount: 75, gift_date: new Date(now - 180 * 24 * 60 * 60 * 1000), gift_type: 'one-time' }
    )
  }

  // Michael Chen - major donor
  const michael = contacts.find(c => c.first_name === 'Michael')
  if (michael) {
    gifts.push(
      { contact_id: michael.id, amount: 500, gift_date: new Date(now - 10 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: michael.id, amount: 500, gift_date: new Date(now - 100 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: michael.id, amount: 250, gift_date: new Date(now - 200 * 24 * 60 * 60 * 1000), gift_type: 'one-time' }
    )
  }

  // David Wilson - top donor
  const david = contacts.find(c => c.first_name === 'David')
  if (david) {
    gifts.push(
      { contact_id: david.id, amount: 1000, gift_date: new Date(now - 30 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: david.id, amount: 2500, gift_date: new Date(now - 120 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: david.id, amount: 1500, gift_date: new Date(now - 250 * 24 * 60 * 60 * 1000), gift_type: 'one-time' }
    )
  }

  // Jennifer Brown - lapsed
  const jennifer = contacts.find(c => c.first_name === 'Jennifer')
  if (jennifer) {
    gifts.push(
      { contact_id: jennifer.id, amount: 250, gift_date: new Date(now - 400 * 24 * 60 * 60 * 1000), gift_type: 'one-time' }
    )
  }

  // Amanda Martinez - recurring
  const amanda = contacts.find(c => c.first_name === 'Amanda')
  if (amanda) {
    gifts.push(
      { contact_id: amanda.id, amount: 50, gift_date: new Date(now - 5 * 24 * 60 * 60 * 1000), gift_type: 'recurring' },
      { contact_id: amanda.id, amount: 50, gift_date: new Date(now - 35 * 24 * 60 * 60 * 1000), gift_type: 'recurring' },
      { contact_id: amanda.id, amount: 50, gift_date: new Date(now - 65 * 24 * 60 * 60 * 1000), gift_type: 'recurring' }
    )
  }

  // Christopher Thomas
  const chris = contacts.find(c => c.first_name === 'Christopher')
  if (chris) {
    gifts.push(
      { contact_id: chris.id, amount: 150, gift_date: new Date(now - 20 * 24 * 60 * 60 * 1000), gift_type: 'one-time' },
      { contact_id: chris.id, amount: 100, gift_date: new Date(now - 100 * 24 * 60 * 60 * 1000), gift_type: 'one-time' }
    )
  }

  for (const gift of gifts) {
    const { error } = await supabase
      .from('gifts')
      .insert({ ...gift, organization_id: orgId })

    if (error && !error.message.includes('duplicate')) {
      console.error('Error inserting gift:', error.message)
    }
  }

  console.log(`Created ${gifts.length} gifts`)
}

async function seedGivingPotential(contacts) {
  console.log('\n=== Seeding Giving Potential Data ===')

  const sarah = contacts.find(c => c.first_name === 'Sarah')
  const michael = contacts.find(c => c.first_name === 'Michael')
  const david = contacts.find(c => c.first_name === 'David')
  const jennifer = contacts.find(c => c.first_name === 'Jennifer')
  const chris = contacts.find(c => c.first_name === 'Christopher')
  const amanda = contacts.find(c => c.first_name === 'Amanda')

  const givingPotentialData = []

  if (sarah) {
    givingPotentialData.push({
      contact_id: sarah.id,
      organization_id: orgId,
      estimated_net_worth: 850000,
      real_estate_value: 650000,
      stock_holdings: 120000,
      political_donations: 2500,
      nonprofit_board_count: 2,
      employer: 'Tech Innovations Inc.',
      job_title: 'VP of Marketing',
      capacity_score: 85,
      affinity_score: 78,
      propensity_score: 82,
      overall_score: 82,
      giving_gap_ratio: 0.015,
      data_sources: { zillow: true, linkedin: true, fec: true }
    })
  }

  if (michael) {
    givingPotentialData.push({
      contact_id: michael.id,
      organization_id: orgId,
      estimated_net_worth: 2500000,
      real_estate_value: 1200000,
      stock_holdings: 800000,
      political_donations: 15000,
      nonprofit_board_count: 4,
      employer: 'Google',
      job_title: 'Senior Director',
      capacity_score: 95,
      affinity_score: 88,
      propensity_score: 91,
      overall_score: 91,
      giving_gap_ratio: 0.02,
      data_sources: { zillow: true, linkedin: true, fec: true, sec: true }
    })
  }

  if (david) {
    givingPotentialData.push({
      contact_id: david.id,
      organization_id: orgId,
      estimated_net_worth: 3200000,
      real_estate_value: 1800000,
      stock_holdings: 950000,
      political_donations: 25000,
      nonprofit_board_count: 5,
      employer: 'Wilson Family Office',
      job_title: 'Founder & CEO',
      capacity_score: 98,
      affinity_score: 92,
      propensity_score: 95,
      overall_score: 95,
      giving_gap_ratio: 0.003,
      data_sources: { zillow: true, linkedin: true, fec: true, sec: true, '990': true }
    })
  }

  if (jennifer) {
    givingPotentialData.push({
      contact_id: jennifer.id,
      organization_id: orgId,
      estimated_net_worth: 1100000,
      real_estate_value: 750000,
      stock_holdings: 200000,
      political_donations: 5000,
      nonprofit_board_count: 3,
      employer: 'Brown Law Partners',
      job_title: 'Managing Partner',
      capacity_score: 88,
      affinity_score: 45,
      propensity_score: 55,
      overall_score: 63,
      giving_gap_ratio: 0.002,
      data_sources: { zillow: true, linkedin: true, fec: true }
    })
  }

  if (chris) {
    givingPotentialData.push({
      contact_id: chris.id,
      organization_id: orgId,
      estimated_net_worth: 680000,
      real_estate_value: 450000,
      stock_holdings: 100000,
      political_donations: 1200,
      nonprofit_board_count: 1,
      employer: 'Community Foundation',
      job_title: 'Program Director',
      capacity_score: 72,
      affinity_score: 95,
      propensity_score: 88,
      overall_score: 85,
      giving_gap_ratio: 0.022,
      data_sources: { zillow: true, linkedin: true }
    })
  }

  if (amanda) {
    givingPotentialData.push({
      contact_id: amanda.id,
      organization_id: orgId,
      estimated_net_worth: 520000,
      real_estate_value: 380000,
      stock_holdings: 80000,
      political_donations: 800,
      nonprofit_board_count: 0,
      employer: 'Martinez Consulting',
      job_title: 'Consultant',
      capacity_score: 68,
      affinity_score: 72,
      propensity_score: 70,
      overall_score: 70,
      giving_gap_ratio: 0.058,
      data_sources: { zillow: true, linkedin: true }
    })
  }

  for (const data of givingPotentialData) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('giving_potential')
      .select('id')
      .eq('contact_id', data.contact_id)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing
      const { error } = await supabase
        .from('giving_potential')
        .update(data)
        .eq('contact_id', data.contact_id)

      if (error) {
        console.error('Error updating giving potential:', error.message)
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('giving_potential')
        .insert(data)

      if (error) {
        console.error('Error inserting giving potential:', error.message)
      }
    }
  }

  console.log(`Created ${givingPotentialData.length} giving potential records`)
}

async function seedMajorGiftPipeline(contacts) {
  console.log('\n=== Seeding Major Gift Pipeline Data ===')

  // Get a user ID for assignment
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .limit(1)

  const userId = members?.[0]?.user_id

  const david = contacts.find(c => c.first_name === 'David')
  const michael = contacts.find(c => c.first_name === 'Michael')
  const sarah = contacts.find(c => c.first_name === 'Sarah')
  const jennifer = contacts.find(c => c.first_name === 'Jennifer')
  const chris = contacts.find(c => c.first_name === 'Christopher')

  const prospects = []

  if (david) {
    prospects.push({
      id: crypto.randomUUID(),
      contact_id: david.id,
      organization_id: orgId,
      stage: 'solicitation',
      stage_entered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      target_ask_amount: 50000,
      target_ask_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: userId,
      readiness_score: 92,
      predicted_gift_amount: 45000,
      recommended_ask_amount: 50000,
      optimal_ask_timing: 'December - year-end giving',
      next_move: 'Schedule final meeting with board chair',
      next_move_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      outcome: 'pending',
      notes: 'David has been highly engaged. Board chair relationship is key.'
    })
  }

  if (michael) {
    prospects.push({
      id: crypto.randomUUID(),
      contact_id: michael.id,
      organization_id: orgId,
      stage: 'cultivation',
      stage_entered_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      target_ask_amount: 25000,
      target_ask_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: userId,
      readiness_score: 78,
      predicted_gift_amount: 20000,
      recommended_ask_amount: 25000,
      optimal_ask_timing: 'Q1 2025 - after bonus season',
      next_move: 'Invite to program site visit',
      next_move_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      outcome: 'pending',
      notes: 'Michael is very interested in our youth programs.'
    })
  }

  if (sarah) {
    prospects.push({
      id: crypto.randomUUID(),
      contact_id: sarah.id,
      organization_id: orgId,
      stage: 'qualification',
      stage_entered_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      target_ask_amount: 10000,
      target_ask_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: userId,
      readiness_score: 55,
      predicted_gift_amount: 7500,
      recommended_ask_amount: 10000,
      optimal_ask_timing: 'Spring 2025',
      next_move: 'Research capacity and connections',
      next_move_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      outcome: 'pending',
      notes: 'New prospect - needs more cultivation.'
    })
  }

  if (jennifer) {
    prospects.push({
      id: crypto.randomUUID(),
      contact_id: jennifer.id,
      organization_id: orgId,
      stage: 'identification',
      stage_entered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      target_ask_amount: 15000,
      assigned_to: userId,
      readiness_score: 35,
      predicted_gift_amount: 10000,
      recommended_ask_amount: 15000,
      optimal_ask_timing: 'TBD - needs more research',
      next_move: 'Initial discovery meeting',
      next_move_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      outcome: 'pending',
      notes: 'High capacity but low current engagement.'
    })
  }

  if (chris) {
    prospects.push({
      id: crypto.randomUUID(),
      contact_id: chris.id,
      organization_id: orgId,
      stage: 'stewardship',
      stage_entered_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      target_ask_amount: 5000,
      assigned_to: userId,
      readiness_score: 88,
      predicted_gift_amount: 5000,
      recommended_ask_amount: 7500,
      optimal_ask_timing: 'Annual renewal in March',
      actual_gift_amount: 5000,
      outcome: 'won',
      notes: 'Successfully closed! Now in stewardship. Very engaged.'
    })
  }

  const insertedProspects = []
  for (const prospect of prospects) {
    const { data, error } = await supabase
      .from('major_gift_prospects')
      .upsert(prospect, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('Error inserting prospect:', error.message)
    } else if (data) {
      insertedProspects.push(data[0])
    }
  }
  console.log(`Created ${prospects.length} major gift prospects`)

  // Add cultivation moves
  if (insertedProspects.length > 0) {
    const moves = []

    // David's moves (solicitation stage)
    const davidProspect = insertedProspects.find(p => p.contact_id === david?.id)
    if (davidProspect) {
      moves.push(
        {
          prospect_id: davidProspect.id,
          organization_id: orgId,
          move_type: 'meeting',
          move_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Initial discovery lunch - discussed family foundation interests',
          outcome: 'Very positive. David mentioned interest in legacy giving.',
          next_step: 'Send impact report and foundation info',
          logged_by: userId
        },
        {
          prospect_id: davidProspect.id,
          organization_id: orgId,
          move_type: 'tour',
          move_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Site visit to youth program facility',
          outcome: 'Deeply moved by student presentations. Asked about naming opportunities.',
          next_step: 'Prepare naming opportunity proposal',
          logged_by: userId
        },
        {
          prospect_id: davidProspect.id,
          organization_id: orgId,
          move_type: 'call',
          move_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Follow-up call to discuss naming proposal',
          outcome: 'Interested in $50K scholarship fund naming. Wants to meet board chair.',
          next_step: 'Coordinate meeting with board chair',
          logged_by: userId
        }
      )
    }

    // Michael's moves (cultivation stage)
    const michaelProspect = insertedProspects.find(p => p.contact_id === michael?.id)
    if (michaelProspect) {
      moves.push(
        {
          prospect_id: michaelProspect.id,
          organization_id: orgId,
          move_type: 'email',
          move_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Sent annual report and impact metrics',
          outcome: 'Replied with questions about tech education programs.',
          next_step: 'Schedule call to discuss tech programs',
          logged_by: userId
        },
        {
          prospect_id: michaelProspect.id,
          organization_id: orgId,
          move_type: 'event',
          move_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Attended our annual gala - sat at VIP table',
          outcome: 'Made several new connections. Very engaged throughout evening.',
          next_step: 'Thank you call and site visit invitation',
          logged_by: userId
        }
      )
    }

    for (const move of moves) {
      const { error } = await supabase
        .from('cultivation_moves')
        .insert(move)

      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting move:', error.message)
      }
    }
    console.log(`Created ${moves.length} cultivation moves`)
  }
}

async function seedImpactStories(contacts) {
  console.log('\n=== Seeding Impact Stories Data ===')

  // First, create program metrics
  const programMetrics = [
    {
      organization_id: orgId,
      program_name: 'Food Assistance Program',
      metric_name: 'meals provided',
      metric_value: 15420,
      cost_per_unit: 3.50,
      time_period: '2024',
      description: 'Nutritious meals served to families in need'
    },
    {
      organization_id: orgId,
      program_name: 'Housing Support',
      metric_name: 'families housed',
      metric_value: 47,
      cost_per_unit: 850,
      time_period: '2024',
      description: 'Emergency housing assistance for families'
    },
    {
      organization_id: orgId,
      program_name: 'Youth Education',
      metric_name: 'students served',
      metric_value: 234,
      cost_per_unit: 125,
      time_period: '2024',
      description: 'After-school tutoring and mentorship'
    },
    {
      organization_id: orgId,
      program_name: 'Job Training',
      metric_name: 'people trained',
      metric_value: 89,
      cost_per_unit: 450,
      time_period: '2024',
      description: 'Workforce development and job placement'
    },
    {
      organization_id: orgId,
      program_name: 'Health Services',
      metric_name: 'clinic visits',
      metric_value: 1250,
      cost_per_unit: 45,
      time_period: '2024',
      description: 'Free health screenings and basic care'
    }
  ]

  for (const metric of programMetrics) {
    const { error } = await supabase
      .from('program_metrics')
      .insert(metric)

    if (error && !error.message.includes('duplicate')) {
      console.error('Error inserting metric:', error.message)
    }
  }
  console.log(`Created ${programMetrics.length} program metrics`)

  // Create impact stories
  const michael = contacts.find(c => c.first_name === 'Michael')
  const david = contacts.find(c => c.first_name === 'David')
  const sarah = contacts.find(c => c.first_name === 'Sarah')

  const impactStories = []

  if (michael) {
    impactStories.push({
      contact_id: michael.id,
      organization_id: orgId,
      time_period: '2024',
      total_giving: 1250,
      narrative: `Michael, your generous gifts totaling $1,250 this year have created a ripple effect of hope throughout our community. Your support provided 357 nutritious meals to families facing food insecurity, giving parents peace of mind knowing their children wouldn't go hungry. But it didn't stop there — your gift also helped one family find stable housing during a crisis moment, and funded 10 students in our after-school tutoring program who are now thriving academically. One of those students, Marcus, just received his first A in math — something he told us he never thought possible. That's the power of your generosity, Michael. Thank you for believing in our mission.`,
      headline: 'You transformed 357 meals into hope',
      impact_breakdown: {
        'meals provided': 357,
        'families housed': 1.5,
        'students served': 10,
        'clinic visits': 28
      },
      share_token: 'mchen-2024-impact-' + Date.now()
    })
  }

  if (david) {
    impactStories.push({
      contact_id: david.id,
      organization_id: orgId,
      time_period: '2024',
      total_giving: 5000,
      narrative: `David, your extraordinary $5,000 in gifts has been nothing short of transformational for our community. This year, your generosity provided 1,428 meals to families in need, helped secure housing for 6 families that were on the brink of homelessness, and supported 40 students in our youth education program. The Garcia family sent us a note saying: "For the first time in months, we could focus on getting back on our feet instead of worrying about where we'd sleep." Your investment in their future gave them that chance, David. Additionally, 11 community members received job training that led to employment. We are deeply grateful for your partnership.`,
      headline: 'You gave 6 families a fresh start',
      impact_breakdown: {
        'meals provided': 1428,
        'families housed': 6,
        'students served': 40,
        'people trained': 11,
        'clinic visits': 111
      },
      share_token: 'dwilson-2024-impact-' + Date.now()
    })
  }

  if (sarah) {
    impactStories.push({
      contact_id: sarah.id,
      organization_id: orgId,
      time_period: '2024',
      total_giving: 225,
      narrative: `Sarah, your gifts totaling $225 this year have touched more lives than you might imagine. Your support provided 64 meals to our neighbors facing hunger, contributed to tutoring support for 2 students working hard to improve their grades, and funded 5 health clinic visits for community members without access to regular healthcare. One elderly gentleman, Mr. Thompson, was able to catch a health concern early thanks to a screening your gift helped fund. That early detection may have saved his life. Thank you for being part of our mission, Sarah.`,
      headline: 'Your gift helped catch a health concern early',
      impact_breakdown: {
        'meals provided': 64,
        'students served': 1.8,
        'clinic visits': 5
      },
      share_token: 'sjohnson-2024-impact-' + Date.now()
    })
  }

  for (const story of impactStories) {
    const { error } = await supabase
      .from('impact_stories')
      .insert(story)

    if (error && !error.message.includes('duplicate')) {
      console.error('Error inserting story:', error.message)
    }
  }
  console.log(`Created ${impactStories.length} impact stories`)
}

async function main() {
  console.log('Starting to seed new features data...')
  console.log('Organization ID:', orgId)

  try {
    // First verify we can connect and org exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      console.error('Organization not found!')
      console.error('Error:', orgError?.message)
      return
    }
    console.log('Found organization:', org.name)

    // Create contacts and gifts first
    const contacts = await seedContacts()
    await seedGifts(contacts)

    // Seed all new features
    await seedGivingPotential(contacts)
    await seedMajorGiftPipeline(contacts)
    await seedImpactStories(contacts)

    console.log('\n=== Seed Complete! ===')
    console.log('\n📧 Test User Credentials:')
    console.log('   Email: (the account you already use for this project)')
    console.log('   Password: (use your existing password)')
    console.log('\n🌐 URL: https://flourishnpo.com/login')
    console.log('\n🎯 Features to explore:')
    console.log('   • /prospects - View Giving Potential scores')
    console.log('   • /pipeline - Major Gift Pipeline Kanban')
    console.log('   • /donors/[id]/impact - Donor Impact Stories')
    console.log('   • /settings/impact - Program Metrics')

  } catch (error) {
    console.error('Seed failed:', error)
  }
}

main()
