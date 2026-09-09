'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export type SearchContact = {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

/**
 * Search contacts by name or email for use in contact pickers/selectors
 */
export async function searchContacts(query: string): Promise<SearchContact[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()
    const searchTerm = `%${query.trim()}%`

    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .order('first_name', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error searching contacts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchContacts:', error)
    return []
  }
}
