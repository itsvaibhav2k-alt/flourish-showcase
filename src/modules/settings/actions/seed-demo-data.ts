'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import {
  generateContacts,
  generateGifts,
  generateShifts,
  generateSignups,
  generateEmailDrafts,
  generateActivities,
} from '@/lib/demo/generate-data'

export interface SeedDemoDataResult {
  success: boolean
  error?: string
  summary?: {
    contacts: number
    gifts: number
    shifts: number
    signups: number
    drafts: number
    activities: number
  }
}

/**
 * Seeds demo data for the current organization
 * Only works if organization has zero contacts
 */
export async function seedDemoData(): Promise<SeedDemoDataResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    // Get the current user
    const userClient = await createClient()
    const { data: { user }, error: userError } = await userClient.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to load sample data' }
    }

    const supabase = await createClient()

    // Check user role using admin client
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can load sample data.',
      }
    }

    // Check if organization already has contacts
    const { count: existingContacts } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (existingContacts && existingContacts > 0) {
      return {
        success: false,
        error: 'Organization already has contacts. Demo data can only be loaded into empty organizations.'
      }
    }

    // Generate contact data
    const contactsData = generateContacts(30, organizationId)

    // Insert contacts
    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(contactsData)
      .select('id, first_name, last_name, is_donor, is_volunteer')

    if (contactsError || !insertedContacts) {
      console.error('Error inserting contacts:', contactsError)
      return { success: false, error: 'Failed to create demo contacts' }
    }

    // Generate and insert gifts
    const giftsData = generateGifts(insertedContacts, organizationId, 12)
    const { data: insertedGifts, error: giftsError } = await supabase
      .from('gifts')
      .insert(giftsData)
      .select('id, contact_id, amount, gift_date')

    if (giftsError) {
      console.error('Error inserting gifts:', giftsError)
      // Continue despite error - partial data is ok
    }

    // Update donor stats after gifts are created
    // Get unique donor IDs and their stats
    const donorStats = new Map<string, { totalGifts: number; lifetimeGiving: number; lastGiftDate: string }>()

    giftsData.forEach(gift => {
      const existing = donorStats.get(gift.contact_id) || { totalGifts: 0, lifetimeGiving: 0, lastGiftDate: gift.gift_date }
      donorStats.set(gift.contact_id, {
        totalGifts: existing.totalGifts + 1,
        lifetimeGiving: existing.lifetimeGiving + gift.amount,
        lastGiftDate: gift.gift_date > existing.lastGiftDate ? gift.gift_date : existing.lastGiftDate,
      })
    })

    // Update each donor with their stats
    for (const [contactId, stats] of donorStats.entries()) {
      const { error: statsError } = await supabase
        .from('contacts')
        .update({
          total_gifts: stats.totalGifts,
          lifetime_giving: stats.lifetimeGiving,
          last_gift_date: stats.lastGiftDate,
        })
        .eq('id', contactId)

      if (statsError) {
        console.error(`Error updating donor stats for contact ${contactId}:`, statsError)
      }
    }

    // Calculate and update lapse risk for donors
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    for (const [contactId, stats] of donorStats.entries()) {
      const lastGiftDate = new Date(stats.lastGiftDate)
      let lapseRisk: 'low' | 'medium' | 'high' = 'low'

      if (lastGiftDate < sixMonthsAgo) {
        lapseRisk = 'high'
      } else if (lastGiftDate < threeMonthsAgo) {
        lapseRisk = 'medium'
      }

      const { error: lapseError } = await supabase
        .from('contacts')
        .update({ lapse_risk: lapseRisk })
        .eq('id', contactId)

      if (lapseError) {
        console.error(`Error updating lapse risk for contact ${contactId}:`, lapseError)
      }
    }

    // Generate and insert shifts
    const shiftsData = generateShifts(organizationId, 6)
    const { data: insertedShifts, error: shiftsError } = await supabase
      .from('shifts')
      .insert(shiftsData)
      .select('id, capacity')

    if (shiftsError || !insertedShifts) {
      console.error('Error inserting shifts:', shiftsError)
      // Continue despite error
    }

    // Generate and insert shift signups
    let signupsCount = 0
    if (insertedShifts) {
      const volunteers = insertedContacts.filter(c => c.is_volunteer)
      const signupsData = generateSignups(insertedShifts, volunteers)
      const { data: insertedSignups, error: signupsError } = await supabase
        .from('shift_signups')
        .insert(signupsData)
        .select('id')

      if (signupsError) {
        console.error('Error inserting signups:', signupsError)
      } else {
        signupsCount = insertedSignups?.length || 0
      }

      // Update volunteer stats
      const volunteerStats = new Map<string, number>()
      signupsData.forEach(signup => {
        const count = volunteerStats.get(signup.contact_id) || 0
        volunteerStats.set(signup.contact_id, count + 1)
      })

      for (const [contactId, count] of volunteerStats.entries()) {
        // Assume 2-3 hours per shift
        const hours = count * (2 + Math.random())
        const reliability = 70 + Math.random() * 30 // 70-100%

        await supabase
          .from('contacts')
          .update({
            total_volunteer_hours: Math.round(hours),
            reliability_score: Math.round(reliability),
          })
          .eq('id', contactId)
      }
    }

    // Generate and insert email drafts
    const draftsData = generateEmailDrafts(insertedContacts, organizationId, 10)
    const { data: insertedDrafts, error: draftsError } = await supabase
      .from('email_drafts')
      .insert(draftsData)
      .select('id')

    if (draftsError) {
      console.error('Error inserting drafts:', draftsError)
    }

    // Generate and insert activities
    const activitiesData = generateActivities(
      insertedContacts,
      insertedGifts || [],
      organizationId
    )
    const { data: insertedActivities, error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesData)
      .select('id')

    if (activitiesError) {
      console.error('Error inserting activities:', activitiesError)
    }

    return {
      success: true,
      summary: {
        contacts: insertedContacts.length,
        gifts: insertedGifts?.length || 0,
        shifts: insertedShifts?.length || 0,
        signups: signupsCount,
        drafts: insertedDrafts?.length || 0,
        activities: insertedActivities?.length || 0,
      },
    }
  } catch (error) {
    console.error('Error seeding demo data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
