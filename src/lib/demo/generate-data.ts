/**
 * Demo Data Generator
 * Generates realistic sample data for demonstrating Flourish features
 */

import type { TablesInsert } from '@/lib/supabase/types'

// Realistic name data
const FIRST_NAMES = [
  'Sarah', 'Michael', 'Emily', 'James', 'Jennifer', 'David', 'Jessica', 'Robert',
  'Ashley', 'William', 'Amanda', 'Christopher', 'Melissa', 'Matthew', 'Michelle',
  'Daniel', 'Stephanie', 'Joshua', 'Nicole', 'Andrew', 'Elizabeth', 'Joseph',
  'Rebecca', 'Ryan', 'Laura', 'Brian', 'Rachel', 'Kevin', 'Lisa', 'Thomas'
]

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King'
]

const GIFT_AMOUNTS = [25, 50, 100, 250, 500, 1000, 2500, 5000]
const GIFT_TYPES: Array<'one-time' | 'recurring' | 'pledge' | 'in-kind'> = ['one-time', 'recurring', 'pledge', 'in-kind']
const PAYMENT_METHODS = ['credit_card', 'check', 'bank_transfer', 'paypal']
const CAMPAIGNS = ['Annual Fund', 'Spring Campaign', 'End of Year', 'Summer Appeal', 'Capital Campaign']

const SHIFT_TITLES = [
  'Food Bank Distribution',
  'Community Garden Workday',
  'Tutoring Session',
  'Event Setup',
  'Administrative Support',
  'Donation Sorting'
]

const SHIFT_LOCATIONS = [
  'Main Office',
  'Community Center',
  'Downtown Location',
  'North Campus',
  'Warehouse'
]

const EMAIL_TYPES: Array<'thank_you' | 'confirmation' | 'reminder' | 'follow_up' | 'welcome'> = [
  'thank_you', 'confirmation', 'reminder', 'follow_up', 'welcome'
]

const EMAIL_SUBJECTS = {
  thank_you: [
    'Thank you for your generous gift',
    'Your support makes a difference',
    'Grateful for your contribution',
  ],
  confirmation: [
    'Confirmed: Your volunteer shift',
    'You\'re all set for volunteering',
    'Shift confirmation',
  ],
  reminder: [
    'Reminder: Upcoming volunteer shift',
    'Don\'t forget: Your shift tomorrow',
    'Looking forward to seeing you',
  ],
  follow_up: [
    'Following up on your visit',
    'We hope to see you again soon',
    'Thank you for stopping by',
  ],
  welcome: [
    'Welcome to our community',
    'Great to have you with us',
    'Welcome aboard',
  ],
}

const EMAIL_BODIES = {
  thank_you: [
    'Dear {name},\n\nThank you so much for your generous gift of ${amount}. Your support helps us continue our mission and make a real difference in our community.\n\nWith gratitude,\nThe Team',
    'Hi {name},\n\nWe\'re incredibly grateful for your donation of ${amount}. Supporters like you make our work possible.\n\nThank you for believing in our mission!\n\nWarm regards,\nThe Team',
  ],
  confirmation: [
    'Hi {name},\n\nThis confirms your registration for {shift} on {date}. We\'re looking forward to having you join us!\n\nLocation: {location}\n\nSee you soon!\nThe Team',
  ],
  reminder: [
    'Hello {name},\n\nJust a friendly reminder about your volunteer shift tomorrow for {shift}.\n\nTime: {time}\nLocation: {location}\n\nThank you for your commitment!\nThe Team',
  ],
  follow_up: [
    'Hi {name},\n\nIt was wonderful to have you volunteer with us recently. We hope you had a great experience!\n\nWe\'d love to see you again soon.\n\nBest,\nThe Team',
  ],
  welcome: [
    'Welcome {name}!\n\nWe\'re so glad you\'ve joined our community. We look forward to getting to know you better and working together.\n\nWarmly,\nThe Team',
  ],
}

/**
 * Generate random contacts with realistic data
 */
export function generateContacts(count: number, orgId: string): TablesInsert<'contacts'>[] {
  const contacts: TablesInsert<'contacts'>[] = []
  const usedEmails = new Set<string>()

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]

    // Generate unique email
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`
    let emailSuffix = 1
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailSuffix}@example.com`
      emailSuffix++
    }
    usedEmails.add(email)

    // Randomly assign roles
    const isDonor = Math.random() > 0.4 // 60% are donors
    const isVolunteer = Math.random() > 0.5 // 50% are volunteers

    // Generate phone number
    const phone = `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`

    contacts.push({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: Math.random() > 0.3 ? phone : null,
      organization_id: orgId,
      is_donor: isDonor,
      is_volunteer: isVolunteer,
      tags: ['demo-data'],
    })
  }

  return contacts
}

/**
 * Generate gifts spanning multiple months with realistic patterns
 */
export function generateGifts(
  contacts: Array<{ id: string; is_donor: boolean | null; first_name: string; last_name: string }>,
  orgId: string,
  months: number = 12
): TablesInsert<'gifts'>[] {
  const gifts: TablesInsert<'gifts'>[] = []
  const donors = contacts.filter(c => c.is_donor)

  donors.forEach((donor) => {
    // Some donors give recurring, some occasionally
    const isRecurringDonor = Math.random() > 0.7 // 30% recurring donors
    const giftType = isRecurringDonor ? 'recurring' : GIFT_TYPES[Math.floor(Math.random() * GIFT_TYPES.length)]

    // Recurring donors give every month
    if (isRecurringDonor) {
      const recurringAmount = [25, 50, 100][Math.floor(Math.random() * 3)]
      for (let m = 0; m < months; m++) {
        const giftDate = new Date()
        giftDate.setMonth(giftDate.getMonth() - m)
        giftDate.setDate(Math.floor(Math.random() * 28) + 1)

        gifts.push({
          contact_id: donor.id,
          organization_id: orgId,
          amount: recurringAmount,
          gift_date: giftDate.toISOString(),
          gift_type: 'recurring',
          payment_method: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
          campaign: CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)],
        })
      }
    } else {
      // One-time/annual donors: 1-4 gifts in the period
      const giftCount = Math.floor(Math.random() * 3) + 1
      for (let g = 0; g < giftCount; g++) {
        const monthsAgo = Math.floor(Math.random() * months)
        const giftDate = new Date()
        giftDate.setMonth(giftDate.getMonth() - monthsAgo)
        giftDate.setDate(Math.floor(Math.random() * 28) + 1)

        const amount = GIFT_AMOUNTS[Math.floor(Math.random() * GIFT_AMOUNTS.length)]

        gifts.push({
          contact_id: donor.id,
          organization_id: orgId,
          amount,
          gift_date: giftDate.toISOString(),
          gift_type: giftType,
          payment_method: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
          campaign: CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)],
        })
      }
    }

    // Some donors (30%) haven't given in 6+ months (lapsed)
    if (Math.random() > 0.7) {
      const lastGiftIndex = gifts.findIndex(g => g.contact_id === donor.id)
      if (lastGiftIndex >= 0) {
        const oldDate = new Date()
        oldDate.setMonth(oldDate.getMonth() - (7 + Math.floor(Math.random() * 6))) // 7-12 months ago
        gifts[lastGiftIndex].gift_date = oldDate.toISOString()
      }
    }
  })

  return gifts
}

/**
 * Generate upcoming volunteer shifts
 */
export function generateShifts(orgId: string, count: number = 6): TablesInsert<'shifts'>[] {
  const shifts: TablesInsert<'shifts'>[] = []

  for (let i = 0; i < count; i++) {
    const daysAhead = Math.floor(Math.random() * 14) + 1 // 1-14 days ahead
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + daysAhead)
    startDate.setHours(9 + Math.floor(Math.random() * 8), [0, 30][Math.floor(Math.random() * 2)], 0, 0)

    const endDate = new Date(startDate)
    endDate.setHours(startDate.getHours() + 2 + Math.floor(Math.random() * 3)) // 2-4 hours

    shifts.push({
      organization_id: orgId,
      title: SHIFT_TITLES[Math.floor(Math.random() * SHIFT_TITLES.length)],
      description: 'Help us make a difference in our community.',
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      location: SHIFT_LOCATIONS[Math.floor(Math.random() * SHIFT_LOCATIONS.length)],
      capacity: [5, 8, 10, 12][Math.floor(Math.random() * 4)],
      status: 'open',
      is_public: true,
    })
  }

  return shifts
}

/**
 * Generate shift signups for volunteers
 */
export function generateSignups(
  shifts: Array<{ id: string; capacity: number | null }>,
  volunteers: Array<{ id: string }>
): TablesInsert<'shift_signups'>[] {
  const signups: TablesInsert<'shift_signups'>[] = []

  shifts.forEach((shift) => {
    const capacity = shift.capacity || 10
    // Fill 50-90% of capacity
    const signupCount = Math.floor(capacity * (0.5 + Math.random() * 0.4))

    // Randomly select volunteers
    const shuffled = [...volunteers].sort(() => Math.random() - 0.5)
    const selectedVolunteers = shuffled.slice(0, signupCount)

    selectedVolunteers.forEach((volunteer) => {
      // Most are confirmed, some pending
      const status = Math.random() > 0.1 ? 'confirmed' : 'pending'

      signups.push({
        shift_id: shift.id,
        contact_id: volunteer.id,
        status,
        confirmation_sent: true,
      })
    })
  })

  return signups
}

/**
 * Generate AI email drafts
 */
export function generateEmailDrafts(
  contacts: Array<{ id: string; first_name: string; last_name: string; is_donor: boolean | null }>,
  orgId: string,
  count: number = 10
): TablesInsert<'email_drafts'>[] {
  const drafts: TablesInsert<'email_drafts'>[] = []
  const shuffledContacts = [...contacts].sort(() => Math.random() - 0.5).slice(0, count)

  shuffledContacts.forEach((contact, i) => {
    const emailType = EMAIL_TYPES[Math.floor(Math.random() * EMAIL_TYPES.length)]
    const subjects = EMAIL_SUBJECTS[emailType]
    const bodies = EMAIL_BODIES[emailType]

    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    let body = bodies[Math.floor(Math.random() * bodies.length)]

    // Replace placeholders
    body = body.replace('{name}', contact.first_name)
    body = body.replace('${amount}', '100')
    body = body.replace('{shift}', 'Community Garden Workday')
    body = body.replace('{date}', 'Saturday, March 15th')
    body = body.replace('{time}', '10:00 AM')
    body = body.replace('{location}', 'Main Office')

    // Vary the status: 60% draft, 30% reviewed, 10% sent
    let status: 'draft' | 'reviewed' | 'sent' = 'draft'
    const rand = Math.random()
    if (rand > 0.6) status = 'reviewed'
    if (rand > 0.9) status = 'sent'

    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 7)) // Last 7 days

    drafts.push({
      contact_id: contact.id,
      organization_id: orgId,
      email_type: emailType,
      subject,
      body,
      status,
      model_used: 'claude-sonnet-4-5-20250929',
      prompt_version: '1.0',
      created_at: createdDate.toISOString(),
      sent_at: status === 'sent' ? createdDate.toISOString() : null,
    })
  })

  return drafts
}

/**
 * Generate activities for contacts
 */
export function generateActivities(
  contacts: Array<{ id: string; first_name: string; last_name: string; is_donor: boolean | null; is_volunteer: boolean | null }>,
  gifts: Array<{ id: string; contact_id: string; amount: number; gift_date: string }>,
  orgId: string
): TablesInsert<'activities'>[] {
  const activities: TablesInsert<'activities'>[] = []

  // Create gift activities
  gifts.forEach((gift) => {
    const contact = contacts.find(c => c.id === gift.contact_id)
    if (!contact) return

    activities.push({
      contact_id: gift.contact_id,
      organization_id: orgId,
      activity_type: 'gift_recorded',
      description: `donated $${gift.amount}`,
      created_at: gift.gift_date,
      metadata: { gift_id: gift.id, amount: gift.amount },
    })
  })

  // Create some note activities
  contacts.slice(0, 10).forEach((contact) => {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    activities.push({
      contact_id: contact.id,
      organization_id: orgId,
      activity_type: 'note_added',
      description: 'added a note',
      created_at: date.toISOString(),
      metadata: { note: 'Great conversation about upcoming events.' },
    })
  })

  // Create some email activities
  contacts.slice(0, 8).forEach((contact) => {
    const daysAgo = Math.floor(Math.random() * 14)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    activities.push({
      contact_id: contact.id,
      organization_id: orgId,
      activity_type: 'email_sent',
      description: 'received an email',
      created_at: date.toISOString(),
      metadata: { subject: 'Thank you for your support' },
    })
  })

  return activities
}
