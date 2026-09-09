'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Contact } from '../schemas/contact.schema'

export type ContactWithRelations = Contact & {
  donation_count?: number
  total_donated?: number
  volunteer_hours?: number
  last_activity?: string
  last_gift_date?: string
  gifts?: Array<{
    id: string
    amount: number
    gift_date: string
    gift_type: string
    notes?: string
  }>
}

/**
 * Get a single contact by ID with related data.
 */
export async function getContact(
  contactId: string
): Promise<ContactWithRelations | null> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return null
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch contact with gifts in a single query using left join
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .single()

    if (contactError) {
      if (contactError.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Error fetching contact:', contactError)
      throw new Error(contactError.message)
    }

    // Fetch gifts for this contact
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, amount, gift_date, gift_type, notes')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .order('gift_date', { ascending: false })

    // Fetch volunteer shift signups to calculate hours
    const { data: shiftSignups } = await supabase
      .from('shift_signups')
      .select(`
        shift_id,
        shifts!inner (
          start_time,
          end_time
        )
      `)
      .eq('contact_id', contactId)
      .eq('status', 'completed')

    // Calculate stats
    const donationCount = gifts?.length || 0
    const totalDonated = gifts?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0
    const lastGiftDate = gifts?.[0]?.gift_date || null

    // Calculate volunteer hours from completed shifts
    let volunteerHours = 0
    if (shiftSignups) {
      for (const signup of shiftSignups) {
        const shift = signup.shifts as any
        if (shift?.start_time && shift?.end_time) {
          const start = new Date(shift.start_time)
          const end = new Date(shift.end_time)
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          volunteerHours += hours
        }
      }
    }

    // Get latest activity timestamp
    const { data: latestActivity } = await supabase
      .from('activities')
      .select('created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const contactWithRelations: ContactWithRelations = {
      ...contact,
      tags: contact.tags ?? [],
      is_donor: contact.is_donor ?? false,
      is_volunteer: contact.is_volunteer ?? false,
      address: contact.address as ContactWithRelations['address'],
      donation_count: donationCount,
      total_donated: totalDonated,
      volunteer_hours: Math.round(volunteerHours),
      last_activity: latestActivity?.created_at || contact.updated_at,
      last_gift_date: lastGiftDate,
      gifts: gifts || [],
    }

    return contactWithRelations
  } catch (error) {
    console.error('Error in getContact:', error)
    throw error
  }
}
