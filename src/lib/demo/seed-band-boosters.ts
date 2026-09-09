'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Seed demo data for Lightridge Band Boosters pitch.
 * Creates realistic contacts, sponsorships, shifts, donations, and voice call logs.
 */
export async function seedBandBoostersDemo(organizationId: string) {
  const supabase = await createClient();

  // ============================================================
  // CONTACTS: 30 realistic band parent/sponsor/donor contacts
  // ============================================================
  const parentContacts = [
    { first_name: 'Jennifer', last_name: 'Mitchell', email: 'jennifer.mitchell@gmail.com', phone: '+15713674103', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Robert', last_name: 'Chen', email: 'robert.chen@outlook.com', phone: '+15714829015', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Maria', last_name: 'Rodriguez', email: 'maria.r.rodriguez@gmail.com', phone: '+15719283746', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: false },
    { first_name: 'David', last_name: 'Patel', email: 'dpatel.loudoun@gmail.com', phone: '+15716540298', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Sarah', last_name: 'Thompson', email: 'sarah.thompson@yahoo.com', phone: '+15718273649', tags: ['Band Family', 'Parent'], is_donor: false, is_volunteer: true },
    { first_name: 'Michael', last_name: 'Johnson', email: 'michael.j.johnson@gmail.com', phone: '+15713928461', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Lisa', last_name: 'Wang', email: 'lisa.wang.va@gmail.com', phone: '+15715847392', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: false },
    { first_name: 'James', last_name: 'Anderson', email: 'james.anderson@hotmail.com', phone: '+15712739481', tags: ['Band Family', 'Parent'], is_donor: false, is_volunteer: true },
    { first_name: 'Amanda', last_name: 'Davis', email: 'amanda.davis.loudoun@gmail.com', phone: '+15718492736', tags: ['Band Family', 'Parent', 'Board Member'], is_donor: true, is_volunteer: true },
    { first_name: 'Kevin', last_name: 'Brown', email: 'kevin.brown.aldie@gmail.com', phone: '+15714628397', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@gmail.com', phone: '+15719384726', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Thomas', last_name: 'Wilson', email: 'tom.wilson.sr@outlook.com', phone: '+15712648395', tags: ['Band Family', 'Parent'], is_donor: false, is_volunteer: true },
    { first_name: 'Emily', last_name: 'Clark', email: 'emily.clark.va@gmail.com', phone: '+15717493826', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: false },
    { first_name: 'Brian', last_name: 'Lee', email: 'brian.lee.loudoun@gmail.com', phone: '+15715839274', tags: ['Band Family', 'Parent', 'Board Treasurer'], is_donor: true, is_volunteer: true },
    { first_name: 'Stephanie', last_name: 'Martin', email: 'stephanie.martin@yahoo.com', phone: '+15713847295', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Christopher', last_name: 'Kim', email: 'chris.kim.band@gmail.com', phone: '+15718293746', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: false },
    { first_name: 'Rachel', last_name: 'Garcia', email: 'rachel.garcia@gmail.com', phone: '+15714937286', tags: ['Band Family', 'Parent'], is_donor: false, is_volunteer: true },
    { first_name: 'Daniel', last_name: 'Moore', email: 'daniel.moore.aldie@outlook.com', phone: '+15716829374', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
    { first_name: 'Ashley', last_name: 'Taylor', email: 'ashley.taylor.va@gmail.com', phone: '+15712748396', tags: ['Band Family', 'Parent', 'Board President'], is_donor: true, is_volunteer: true },
    { first_name: 'Mark', last_name: 'Nguyen', email: 'mark.nguyen.sr@gmail.com', phone: '+15718394726', tags: ['Band Family', 'Parent'], is_donor: true, is_volunteer: true },
  ];

  const businessContacts = [
    { first_name: 'Tony', last_name: 'Russo', email: 'tony@aldiecountrystore.com', phone: '+15713928470', tags: ['Sponsor', 'Local Business'], is_donor: true, is_volunteer: false, address: { street: '39474 John Mosby Hwy', city: 'Aldie', state: 'VA', zip: '20105' } },
    { first_name: 'Sandra', last_name: 'Whitfield', email: 'sandra@southridingpizza.com', phone: '+15714839271', tags: ['Sponsor', 'Local Business'], is_donor: true, is_volunteer: false, address: { street: '25401 Eastern Marketplace', city: 'South Riding', state: 'VA', zip: '20152' } },
    { first_name: 'Rick', last_name: 'Pham', email: 'rick@brambletondentalcare.com', phone: '+15718273940', tags: ['Sponsor', 'Local Business'], is_donor: true, is_volunteer: false, address: { street: '42395 Ryan Rd', city: 'Brambleton', state: 'VA', zip: '20148' } },
    { first_name: 'Laura', last_name: 'Henderson', email: 'laura@loudouninsurance.com', phone: '+15716482937', tags: ['Sponsor Prospect', 'Local Business'], is_donor: false, is_volunteer: false, address: { street: '21600 Ridgetop Circle', city: 'Sterling', state: 'VA', zip: '20166' } },
    { first_name: 'Greg', last_name: 'Patterson', email: 'greg@stoneridgeauto.com', phone: '+15719374826', tags: ['Sponsor Prospect', 'Local Business'], is_donor: false, is_volunteer: false, address: { street: '24805 Pinebrook Rd', city: 'Chantilly', state: 'VA', zip: '20152' } },
  ];

  const lapsedDonors = [
    { first_name: 'William', last_name: 'Foster', email: 'william.foster@gmail.com', phone: '+15713847926', tags: ['Alumni Parent', 'Lapsed'], is_donor: true, is_volunteer: false, lapse_risk: 'high' as const },
    { first_name: 'Nancy', last_name: 'Collins', email: 'nancy.collins.va@outlook.com', phone: '+15718293047', tags: ['Alumni Parent', 'Lapsed'], is_donor: true, is_volunteer: false, lapse_risk: 'high' as const },
    { first_name: 'George', last_name: 'Rivera', email: 'george.rivera@yahoo.com', phone: '+15714829730', tags: ['Community Supporter'], is_donor: true, is_volunteer: false, lapse_risk: 'medium' as const },
    { first_name: 'Patricia', last_name: 'Brooks', email: 'patricia.brooks@gmail.com', phone: '+15716394827', tags: ['Alumni Parent'], is_donor: true, is_volunteer: false, lapse_risk: 'medium' as const },
    { first_name: 'Edward', last_name: 'Murphy', email: 'ed.murphy.sr@gmail.com', phone: '+15712937486', tags: ['Community Supporter'], is_donor: true, is_volunteer: false, lapse_risk: 'low' as const },
  ];

  const allContactData = [
    ...parentContacts.map((c) => ({ ...c, organization_id: organizationId, address: c.address ?? {} })),
    ...businessContacts.map((c) => ({ ...c, organization_id: organizationId, address: c.address ?? {} })),
    ...lapsedDonors.map((c) => ({ ...c, organization_id: organizationId, address: c.address ?? {} })),
  ];

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .insert(allContactData)
    .select('id, first_name, last_name, email, tags');

  if (contactsError) {
    throw new Error(`Failed to seed contacts: ${contactsError.message}`);
  }

  const contactMap = new Map(contacts.map((c) => [c.email, c]));

  // ============================================================
  // GIFTS: Donation history spanning 2023-2025
  // ============================================================
  const gifts = [
    // Active donors — recent gifts
    { email: 'jennifer.mitchell@gmail.com', amount: 250, gift_date: '2025-11-15', campaign: 'Annual Fund', payment_method: 'paypal' },
    { email: 'jennifer.mitchell@gmail.com', amount: 100, gift_date: '2025-03-20', campaign: 'Instrument Drive', payment_method: 'check' },
    { email: 'robert.chen@outlook.com', amount: 500, gift_date: '2025-10-01', campaign: 'Annual Fund', payment_method: 'credit_card' },
    { email: 'robert.chen@outlook.com', amount: 200, gift_date: '2024-11-20', campaign: 'Travel Fund', payment_method: 'venmo' },
    { email: 'maria.r.rodriguez@gmail.com', amount: 150, gift_date: '2025-09-15', campaign: 'Annual Fund', payment_method: 'zelle' },
    { email: 'dpatel.loudoun@gmail.com', amount: 300, gift_date: '2025-12-01', campaign: 'Annual Fund', payment_method: 'paypal' },
    { email: 'dpatel.loudoun@gmail.com', amount: 100, gift_date: '2025-06-15', campaign: 'Uniform Replacement', payment_method: 'venmo' },
    { email: 'michael.j.johnson@gmail.com', amount: 75, gift_date: '2025-10-20', campaign: 'Annual Fund', payment_method: 'cash' },
    { email: 'lisa.wang.va@gmail.com', amount: 200, gift_date: '2025-08-30', campaign: 'Travel Fund', payment_method: 'credit_card' },
    { email: 'amanda.davis.loudoun@gmail.com', amount: 500, gift_date: '2025-11-01', campaign: 'Annual Fund', payment_method: 'check' },
    { email: 'amanda.davis.loudoun@gmail.com', amount: 250, gift_date: '2025-04-15', campaign: 'Instrument Drive', payment_method: 'credit_card' },
    { email: 'kevin.brown.aldie@gmail.com', amount: 100, gift_date: '2025-10-10', campaign: 'Annual Fund', payment_method: 'venmo' },
    { email: 'priya.sharma@gmail.com', amount: 175, gift_date: '2025-09-25', campaign: 'Annual Fund', payment_method: 'zelle' },
    { email: 'emily.clark.va@gmail.com', amount: 50, gift_date: '2025-11-20', campaign: 'Annual Fund', payment_method: 'paypal' },
    { email: 'brian.lee.loudoun@gmail.com', amount: 1000, gift_date: '2025-10-05', campaign: 'Annual Fund', payment_method: 'check' },
    { email: 'stephanie.martin@yahoo.com', amount: 125, gift_date: '2025-08-15', campaign: 'Travel Fund', payment_method: 'venmo' },
    { email: 'chris.kim.band@gmail.com', amount: 200, gift_date: '2025-07-01', campaign: 'Instrument Drive', payment_method: 'credit_card' },
    { email: 'daniel.moore.aldie@outlook.com', amount: 150, gift_date: '2025-10-30', campaign: 'Annual Fund', payment_method: 'paypal' },
    { email: 'ashley.taylor.va@gmail.com', amount: 500, gift_date: '2025-09-01', campaign: 'Annual Fund', payment_method: 'check' },
    { email: 'mark.nguyen.sr@gmail.com', amount: 75, gift_date: '2025-11-10', campaign: 'Annual Fund', payment_method: 'zelle' },
    // Business sponsors
    { email: 'tony@aldiecountrystore.com', amount: 500, gift_date: '2025-08-01', campaign: 'Sponsorship - Gold', payment_method: 'check' },
    { email: 'sandra@southridingpizza.com', amount: 250, gift_date: '2025-09-01', campaign: 'Sponsorship - Silver', payment_method: 'check' },
    { email: 'rick@brambletondentalcare.com', amount: 1000, gift_date: '2024-08-15', campaign: 'Sponsorship - Platinum', payment_method: 'check' },
    // Lapsed donors — older gifts
    { email: 'william.foster@gmail.com', amount: 200, gift_date: '2023-11-15', campaign: 'Annual Fund', payment_method: 'check' },
    { email: 'nancy.collins.va@outlook.com', amount: 150, gift_date: '2023-12-01', campaign: 'Annual Fund', payment_method: 'paypal' },
    { email: 'george.rivera@yahoo.com', amount: 100, gift_date: '2024-03-15', campaign: 'Instrument Drive', payment_method: 'venmo' },
    { email: 'patricia.brooks@gmail.com', amount: 75, gift_date: '2024-05-20', campaign: 'Annual Fund', payment_method: 'cash' },
    { email: 'ed.murphy.sr@gmail.com', amount: 300, gift_date: '2025-01-10', campaign: 'Annual Fund', payment_method: 'credit_card' },
  ];

  const giftInserts = gifts
    .map((g) => {
      const contact = contactMap.get(g.email);
      if (!contact) return null;
      return {
        organization_id: organizationId,
        contact_id: contact.id,
        amount: g.amount,
        gift_date: g.gift_date,
        gift_type: 'one-time',
        campaign: g.campaign,
        payment_method: g.payment_method,
        notes: null,
      };
    })
    .filter(Boolean);

  await supabase.from('gifts').insert(giftInserts);

  // ============================================================
  // SPONSORSHIP TIERS
  // ============================================================
  const tierData = [
    { organization_id: organizationId, name: 'Bronze', amount: 100, sort_order: 0, color: '#CD7F32', default_benefits: JSON.stringify([{ name: 'Website listing', description: 'Logo on boosters website' }]) },
    { organization_id: organizationId, name: 'Silver', amount: 250, sort_order: 1, color: '#C0C0C0', default_benefits: JSON.stringify([{ name: 'Website listing', description: 'Logo on boosters website' }, { name: 'Program ad (1/4 page)', description: 'Quarter-page ad in concert programs' }]) },
    { organization_id: organizationId, name: 'Gold', amount: 500, sort_order: 2, color: '#FFD700', default_benefits: JSON.stringify([{ name: 'Website listing', description: 'Logo on boosters website' }, { name: 'Program ad (1/2 page)', description: 'Half-page ad in concert programs' }, { name: 'Banner at events', description: 'Banner displayed at home football games' }, { name: 'Social media shoutout', description: 'Featured post on booster social media' }]) },
    { organization_id: organizationId, name: 'Platinum', amount: 1000, sort_order: 3, color: '#E5E4E2', default_benefits: JSON.stringify([{ name: 'Website listing', description: 'Premium logo placement on boosters website' }, { name: 'Program ad (full page)', description: 'Full-page ad in all concert programs' }, { name: 'Banner at events', description: 'Premium banner displayed at all events' }, { name: 'Social media shoutout', description: 'Monthly featured post on booster social media' }, { name: 'Announcer mention', description: 'Live mention during halftime at home games' }, { name: 'VIP reception invite', description: 'Invitation to annual booster VIP reception' }]) },
  ];

  const { data: tiers } = await supabase
    .from('sponsorship_tiers')
    .insert(tierData)
    .select('id, name');

  const tierMap = new Map(tiers?.map((t) => [t.name, t.id]) ?? []);

  // ============================================================
  // SPONSORSHIPS
  // ============================================================
  const sponsorshipData = [
    {
      organization_id: organizationId,
      contact_id: contactMap.get('tony@aldiecountrystore.com')?.id,
      tier_id: tierMap.get('Gold'),
      status: 'active',
      amount: 500,
      season: '2025-2026 Marching Season',
      start_date: '2025-08-01',
      end_date: '2026-06-30',
      renewal_date: '2026-05-01',
      payment_received: true,
    },
    {
      organization_id: organizationId,
      contact_id: contactMap.get('sandra@southridingpizza.com')?.id,
      tier_id: tierMap.get('Silver'),
      status: 'active',
      amount: 250,
      season: '2025-2026 Marching Season',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      renewal_date: '2026-05-01',
      payment_received: true,
    },
    {
      organization_id: organizationId,
      contact_id: contactMap.get('rick@brambletondentalcare.com')?.id,
      tier_id: tierMap.get('Platinum'),
      status: 'lapsed',
      amount: 1000,
      season: '2024-2025 Season',
      start_date: '2024-08-15',
      end_date: '2025-06-30',
      renewal_date: '2025-05-01',
      payment_received: true,
      notes: 'Was Platinum sponsor last season. Renewal outreach needed.',
    },
    {
      organization_id: organizationId,
      contact_id: contactMap.get('laura@loudouninsurance.com')?.id,
      tier_id: tierMap.get('Gold'),
      status: 'pitched',
      amount: 500,
      season: '2025-2026 Marching Season',
      notes: 'Flora called on 2/10 — interested, wants to see proposal. Follow up scheduled.',
      next_follow_up: '2026-03-05T14:00:00Z',
      last_contact_date: '2026-02-10T16:00:00Z',
    },
    {
      organization_id: organizationId,
      contact_id: contactMap.get('greg@stoneridgeauto.com')?.id,
      tier_id: null,
      status: 'prospect',
      season: '2025-2026 Marching Season',
      notes: 'Referred by Jennifer Mitchell. Not yet contacted.',
    },
  ];

  const { data: sponsorships } = await supabase
    .from('sponsorships')
    .insert(sponsorshipData)
    .select('id, contact_id, tier_id, status');

  // Add benefits for active sponsors
  if (sponsorships) {
    const benefitInserts: any[] = [];
    for (const sp of sponsorships) {
      if (sp.status === 'active' && sp.tier_id) {
        const tier = tiers?.find((t) => t.id === sp.tier_id);
        const tierDef = tierData.find((t) => t.name === tier?.name);
        if (tierDef) {
          const benefits = JSON.parse(tierDef.default_benefits as string) as Array<{ name: string; description: string }>;
          benefits.forEach((b, i) => {
            benefitInserts.push({
              sponsorship_id: sp.id,
              organization_id: organizationId,
              benefit_name: b.name,
              description: b.description,
              // Mark some as delivered for realism
              delivered: i < Math.ceil(benefits.length / 2),
              delivered_at: i < Math.ceil(benefits.length / 2) ? '2025-10-01T00:00:00Z' : null,
            });
          });
        }
      }
    }
    if (benefitInserts.length > 0) {
      await supabase.from('sponsorship_benefits').insert(benefitInserts);
    }
  }

  // ============================================================
  // VOLUNTEER SHIFTS
  // ============================================================
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));

  const pastShiftDate = new Date(now);
  pastShiftDate.setDate(now.getDate() - 7);

  const futureShiftDate = new Date(now);
  futureShiftDate.setDate(now.getDate() + 21);

  const shiftData = [
    {
      organization_id: organizationId,
      title: 'Concession Stand — Marching Storm vs. Riverside',
      description: 'Work the concession stand during Friday night football game. Duties include serving food, handling cash, and cleanup.',
      location: 'Lightridge Stadium',
      start_time: new Date(nextFriday.setHours(17, 30, 0, 0)).toISOString(),
      end_time: new Date(nextFriday.setHours(21, 30, 0, 0)).toISOString(),
      capacity: 8,
      status: 'open',
      is_public: true,
    },
    {
      organization_id: organizationId,
      title: 'Equipment Loading — Loudoun County Competition',
      description: 'Help load and unload instruments, props, and equipment for the competition trip.',
      location: 'Lightridge High School Band Room',
      start_time: new Date(pastShiftDate.setHours(6, 0, 0, 0)).toISOString(),
      end_time: new Date(pastShiftDate.setHours(8, 0, 0, 0)).toISOString(),
      capacity: 10,
      status: 'completed',
      is_public: false,
    },
    {
      organization_id: organizationId,
      title: 'Competition Chaperone — States Championship',
      description: 'Chaperone students at the Virginia States Marching Band Championship. Full day event.',
      location: 'Liberty University, Lynchburg VA',
      start_time: new Date(futureShiftDate.setHours(7, 0, 0, 0)).toISOString(),
      end_time: new Date(futureShiftDate.setHours(22, 0, 0, 0)).toISOString(),
      capacity: 6,
      status: 'open',
      is_public: true,
    },
  ];

  const { data: shifts } = await supabase
    .from('shifts')
    .insert(shiftData)
    .select('id, title, status');

  // Sign up volunteers for shifts
  if (shifts && contacts) {
    const upcomingShift = shifts.find((s) => s.title.includes('Concession'));
    const pastShift = shifts.find((s) => s.status === 'completed');

    if (upcomingShift) {
      // 5 of 8 slots filled
      const volunteerEmails = [
        'jennifer.mitchell@gmail.com', 'david.patel@gmail.com',
        'sarah.thompson@yahoo.com', 'michael.j.johnson@gmail.com',
        'kevin.brown.aldie@gmail.com',
      ];
      const signups = volunteerEmails
        .map((email) => {
          // Use dpatel email for David Patel
          const actualEmail = email === 'david.patel@gmail.com' ? 'dpatel.loudoun@gmail.com' : email;
          const contact = contactMap.get(actualEmail);
          if (!contact) return null;
          return {
            shift_id: upcomingShift.id,
            contact_id: contact.id,
            status: 'confirmed',
            confirmation_sent: true,
          };
        })
        .filter(Boolean);

      await supabase.from('shift_signups').insert(signups);
    }

    if (pastShift) {
      // 8 signed up: 6 showed, 2 no-shows
      const pastVolunteers = [
        { email: 'jennifer.mitchell@gmail.com', showed: true, hours: 2 },
        { email: 'robert.chen@outlook.com', showed: true, hours: 2 },
        { email: 'dpatel.loudoun@gmail.com', showed: true, hours: 2 },
        { email: 'michael.j.johnson@gmail.com', showed: true, hours: 2 },
        { email: 'amanda.davis.loudoun@gmail.com', showed: true, hours: 2 },
        { email: 'priya.sharma@gmail.com', showed: true, hours: 2 },
        { email: 'james.anderson@hotmail.com', showed: false, hours: 0 },
        { email: 'tom.wilson.sr@outlook.com', showed: false, hours: 0 },
      ];

      const pastSignups = pastVolunteers
        .map((v) => {
          const contact = contactMap.get(v.email);
          if (!contact) return null;
          return {
            shift_id: pastShift.id,
            contact_id: contact.id,
            status: 'completed' as const,
            no_show: !v.showed,
            checked_in_at: v.showed ? pastShiftDate.toISOString() : null,
            hours_logged: v.hours,
            confirmation_sent: true,
            reminder_1_sent: true,
            thank_you_sent: v.showed,
          };
        })
        .filter(Boolean);

      await supabase.from('shift_signups').insert(pastSignups);
    }
  }

  // ============================================================
  // ACTIVITIES: Recent activity log entries
  // ============================================================
  const activityInserts = [
    { organization_id: organizationId, contact_id: contactMap.get('jennifer.mitchell@gmail.com')?.id, activity_type: 'gift_received', description: 'Gift of $250.00 received — Annual Fund', metadata: {} },
    { organization_id: organizationId, contact_id: contactMap.get('brian.lee.loudoun@gmail.com')?.id, activity_type: 'gift_received', description: 'Gift of $1,000.00 received — Annual Fund', metadata: {} },
    { organization_id: organizationId, contact_id: contactMap.get('tony@aldiecountrystore.com')?.id, activity_type: 'email_sent', description: 'Sponsor thank-you email sent', metadata: {} },
    { organization_id: organizationId, contact_id: contactMap.get('laura@loudouninsurance.com')?.id, activity_type: 'call_completed', description: 'Flora sponsor outreach call — interested, follow-up scheduled', metadata: {} },
    { organization_id: organizationId, contact_id: contactMap.get('amanda.davis.loudoun@gmail.com')?.id, activity_type: 'email_sent', description: 'Volunteer shift confirmation sent — Concession Stand', metadata: {} },
  ];

  await supabase.from('activities').insert(activityInserts.filter((a) => a.contact_id));

  return {
    success: true,
    summary: {
      contacts: contacts.length,
      gifts: giftInserts.length,
      tiers: tierData.length,
      sponsorships: sponsorshipData.length,
      shifts: shiftData.length,
    },
  };
}
