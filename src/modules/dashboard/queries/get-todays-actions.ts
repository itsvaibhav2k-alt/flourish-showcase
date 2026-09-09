'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface TodayAction {
  id: string
  type: 'understaffed_shift' | 'lapsing_donor' | 'pending_email' | 'top_volunteer' | 'birthday'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionUrl: string
  actionLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
}

/**
 * Get prioritized actions for today
 * Returns top 5 actions that need attention, sorted by priority:
 *
 * HIGH PRIORITY (shown first):
 * - Lapsing donors (no gift in 6+ months) - Re-engagement needed
 * - Understaffed shifts (within 48 hours, <50% filled) - Urgent recruitment
 *
 * MEDIUM PRIORITY:
 * - Pending email drafts - AI-generated emails awaiting review
 * - Top volunteers (20+ hours) - Recognition opportunities
 *
 * LOW PRIORITY:
 * - Upcoming birthdays (within 7 days) - Personal touches
 *
 * Actions can be dismissed by users and won't reappear.
 */
export async function getTodaysActions(): Promise<TodayAction[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()
    const actions: TodayAction[] = []

    // Get dismissed actions to filter them out
    const { data: dismissedActions } = await supabase
      .from('action_dismissals')
      .select('action_key')
      .eq('organization_id', organizationId)

    const dismissedKeys = new Set(dismissedActions?.map(d => d.action_key) || [])

    // Calculate time window for shifts (next 48 hours)
    const now = new Date()
    const fortyEightHoursFromNow = new Date(now)
    fortyEightHoursFromNow.setHours(now.getHours() + 48)

    // 1. Get understaffed shifts (high priority)
    const { data: shifts } = await supabase
      .from('shifts')
      .select(`
        id,
        title,
        start_time,
        capacity,
        location,
        shift_signups (
          id,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .gte('start_time', now.toISOString())
      .lte('start_time', fortyEightHoursFromNow.toISOString())
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    if (shifts && shifts.length > 0) {
      for (const shift of shifts) {
        const signups = Array.isArray(shift.shift_signups) ? shift.shift_signups : []
        const confirmedCount = signups.filter(
          s => s.status === 'confirmed' || s.status === 'completed'
        ).length
        const capacity = shift.capacity || 0
        const fillRate = capacity > 0 ? (confirmedCount / capacity) * 100 : 0

        // Only include if less than 50% filled
        if (fillRate < 50) {
          const spotsNeeded = capacity - confirmedCount
          const actionKey = `shift-${shift.id}-understaffed`

          // Skip if dismissed
          if (!dismissedKeys.has(actionKey)) {
            actions.push({
              id: actionKey,
              type: 'understaffed_shift',
              priority: 'high',
              title: 'Shift needs volunteers',
              description: `${shift.title} - ${spotsNeeded} spot${spotsNeeded !== 1 ? 's' : ''} needed${shift.location ? ` at ${shift.location}` : ''}`,
              actionUrl: `/volunteers/shifts/${shift.id}`,
              actionLabel: 'Fill Shift',
              metadata: {
                shiftTitle: shift.title,
                startTime: shift.start_time,
                confirmedCount,
                capacity,
                fillRate: Math.round(fillRate),
                location: shift.location,
              },
            })
          }
        }
      }
    }

    // 2. Get lapsing donors (high priority) - no gift in 6+ months
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(now.getMonth() - 6)

    const { data: donors } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, lapse_risk, last_gift_date, lifetime_giving')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .not('last_gift_date', 'is', null)
      .lte('last_gift_date', sixMonthsAgo.toISOString())
      .order('last_gift_date', { ascending: true })
      .limit(5)

    if (donors && donors.length > 0) {
      for (const donor of donors) {
        const lastGiftDate = donor.last_gift_date ? new Date(donor.last_gift_date) : null
        const daysSinceLastGift = lastGiftDate
          ? Math.floor((now.getTime() - lastGiftDate.getTime()) / (1000 * 60 * 60 * 24))
          : null

        const actionKey = `donor-${donor.id}-lapse`

        // Skip if dismissed
        if (!dismissedKeys.has(actionKey)) {
          actions.push({
            id: actionKey,
            type: 'lapsing_donor',
            priority: 'high',
            title: 'Donor at risk of lapsing',
            description: `${donor.first_name} ${donor.last_name} - ${daysSinceLastGift} days since last gift`,
            actionUrl: `/contacts/${donor.id}`,
            actionLabel: 'Reach Out',
            metadata: {
              firstName: donor.first_name,
              lastName: donor.last_name,
              lapseRisk: donor.lapse_risk,
              daysSinceLastGift,
              lifetimeGiving: donor.lifetime_giving,
            },
          })
        }
      }
    }

    // 3. Get pending emails (medium priority)
    const { data: pendingEmails, count: pendingCount } = await supabase
      .from('email_drafts')
      .select('id, email_type, subject, contact_id, created_at', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'draft')
      .order('created_at', { ascending: true })
      .limit(1)

    if (pendingCount && pendingCount > 0) {
      const actionKey = 'pending-emails'

      // Skip if dismissed
      if (!dismissedKeys.has(actionKey)) {
        // Add a single action for all pending emails
        actions.push({
          id: actionKey,
          type: 'pending_email',
          priority: 'medium',
          title: `${pendingCount} email${pendingCount !== 1 ? 's' : ''} awaiting review`,
          description: `Review AI-generated email drafts before sending`,
          actionUrl: '/communications',
          actionLabel: 'Review',
          metadata: {
            count: pendingCount,
            emails: pendingEmails || [],
          },
        })
      }
    }

    // 4. Get top volunteers (medium priority) - volunteers with > 20 total hours
    const { data: topVolunteers } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, total_volunteer_hours')
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)
      .is('archived_at', null)
      .gt('total_volunteer_hours', 20)
      .order('total_volunteer_hours', { ascending: false })
      .limit(3)

    if (topVolunteers && topVolunteers.length > 0) {
      for (const volunteer of topVolunteers) {
        const actionKey = `volunteer-${volunteer.id}-recognition`

        // Skip if dismissed
        if (!dismissedKeys.has(actionKey)) {
          const hours = Math.round((volunteer.total_volunteer_hours || 0) * 10) / 10

          actions.push({
            id: actionKey,
            type: 'top_volunteer',
            priority: 'medium',
            title: 'Top volunteer to recognize',
            description: `${volunteer.first_name} ${volunteer.last_name} - ${hours} total hours`,
            actionUrl: `/contacts/${volunteer.id}`,
            actionLabel: 'Say Thanks',
            metadata: {
              firstName: volunteer.first_name,
              lastName: volunteer.last_name,
              totalHours: hours,
            },
          })
        }
      }
    }

    // 5. Get upcoming birthdays (low priority) - birthdays in next 7 days
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(now.getDate() + 7)

    // Query contacts with birthdays
    const { data: birthdayContacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, date_of_birth')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .not('date_of_birth', 'is', null)

    if (birthdayContacts && birthdayContacts.length > 0) {
      for (const contact of birthdayContacts) {
        if (!contact.date_of_birth) continue

        // Parse date_of_birth (YYYY-MM-DD format)
        const birthDate = new Date(contact.date_of_birth)
        const birthMonth = birthDate.getMonth()
        const birthDay = birthDate.getDate()

        // Check if birthday is within next 7 days
        const thisYearBirthday = new Date(now.getFullYear(), birthMonth, birthDay)

        // If birthday already passed this year, check next year
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(now.getFullYear() + 1)
        }

        const daysUntilBirthday = Math.floor(
          (thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
          const actionKey = `birthday-${contact.id}-${thisYearBirthday.getFullYear()}`

          // Skip if dismissed
          if (!dismissedKeys.has(actionKey)) {
            const daysText = daysUntilBirthday === 0
              ? 'today'
              : daysUntilBirthday === 1
              ? 'tomorrow'
              : `in ${daysUntilBirthday} days`

            actions.push({
              id: actionKey,
              type: 'birthday',
              priority: 'low',
              title: 'Upcoming birthday',
              description: `${contact.first_name} ${contact.last_name} - Birthday ${daysText}`,
              actionUrl: `/contacts/${contact.id}`,
              actionLabel: 'Send Wishes',
              metadata: {
                firstName: contact.first_name,
                lastName: contact.last_name,
                dateOfBirth: contact.date_of_birth,
                daysUntilBirthday,
              },
            })
          }
        }
      }
    }

    // Sort by priority: high > medium > low
    const priorityMap = { high: 3, medium: 2, low: 1 }
    actions.sort((a, b) => {
      const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Within same priority, sort by type importance
      // Lapsing donors first (higher value), then understaffed shifts
      const typeOrder = {
        lapsing_donor: 5,
        understaffed_shift: 4,
        pending_email: 3,
        top_volunteer: 2,
        birthday: 1
      }
      return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0)
    })

    // Return top 5 actions
    return actions.slice(0, 5)
  } catch (error) {
    console.error('Error in getTodaysActions:', error)
    throw error
  }
}
