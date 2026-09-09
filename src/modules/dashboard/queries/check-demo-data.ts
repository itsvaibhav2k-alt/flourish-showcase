'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

/**
 * Checks if the organization has demo data (contacts with 'demo-data' tag)
 * Returns true if demo data exists, false otherwise
 */
export async function hasDemoDataLoaded(): Promise<boolean> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return false
    }

    const supabase = await createClient()

    const { count, error } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .contains('tags', ['demo-data'])

    if (error) {
      console.error('Error checking for demo data:', error)
      return false
    }

    return (count ?? 0) > 0
  } catch (error) {
    console.error('Error in hasDemoDataLoaded:', error)
    return false
  }
}
