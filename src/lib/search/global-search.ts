'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export type SearchResultType = 'contact' | 'donor' | 'volunteer' | 'shift'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  url: string
}

export interface GlobalSearchResults {
  contacts: SearchResult[]
  donors: SearchResult[]
  volunteers: SearchResult[]
  shifts: SearchResult[]
}

/**
 * Performs a global search across contacts, donors, volunteers, and shifts
 * Returns up to 5 results per category
 */
export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  if (!query || query.trim().length === 0) {
    return {
      contacts: [],
      donors: [],
      volunteers: [],
      shifts: [],
    }
  }

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()
    const searchTerm = `%${query.trim()}%`

    // Search contacts (general contacts, not necessarily donors/volunteers)
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5)

    const contacts: SearchResult[] = (contactsData || []).map((contact) => ({
      id: contact.id,
      type: 'contact' as const,
      title: `${contact.first_name} ${contact.last_name}`,
      subtitle: contact.email || 'No email',
      url: `/contacts/${contact.id}`,
    }))

    // Search donors (contacts marked as donors)
    const { data: donorsData } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .eq('is_donor', true)
      .is('archived_at', null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5)

    const donors: SearchResult[] = (donorsData || []).map((donor) => ({
      id: donor.id,
      type: 'donor' as const,
      title: `${donor.first_name} ${donor.last_name}`,
      subtitle: donor.email || 'No email',
      url: `/donors?contact=${donor.id}`,
    }))

    // Search volunteers (contacts marked as volunteers)
    const { data: volunteersData } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .eq('is_volunteer', true)
      .is('archived_at', null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5)

    const volunteers: SearchResult[] = (volunteersData || []).map((volunteer) => ({
      id: volunteer.id,
      type: 'volunteer' as const,
      title: `${volunteer.first_name} ${volunteer.last_name}`,
      subtitle: volunteer.email || 'No email',
      url: `/volunteers?contact=${volunteer.id}`,
    }))

    // Search shifts by title or description
    const { data: shiftsData } = await supabase
      .from('shifts')
      .select('id, title, description, start_time, location')
      .eq('organization_id', organizationId)
      .neq('status', 'cancelled')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
      .order('start_time', { ascending: true })
      .limit(5)

    const shifts: SearchResult[] = (shiftsData || []).map((shift) => {
      const startTime = new Date(shift.start_time)
      const formattedDate = startTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      return {
        id: shift.id,
        type: 'shift' as const,
        title: shift.title,
        subtitle: `${formattedDate} ${shift.location ? `• ${shift.location}` : ''}`,
        url: `/volunteers/shifts/${shift.id}`,
      }
    })

    return {
      contacts,
      donors,
      volunteers,
      shifts,
    }
  } catch (error) {
    console.error('Error performing global search:', error)
    return {
      contacts: [],
      donors: [],
      volunteers: [],
      shifts: [],
    }
  }
}
