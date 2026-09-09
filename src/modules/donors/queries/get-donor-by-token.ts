'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Contact } from '@/modules/contacts/schemas/contact.schema'
import type { Tables } from '@/lib/supabase/types'

export type Gift = Tables<'gifts'>

export interface DonorPortalData {
  contact: Contact
  gifts: Gift[]
  organization: {
    name: string
  }
}

/**
 * Fetches donor information by portal token.
 * Uses admin client to bypass RLS for public portal access.
 *
 * @param token - The secure portal token
 * @returns Donor data including contact info, recent gifts, and organization name
 */
export async function getDonorByToken(
  token: string
): Promise<DonorPortalData | null> {
  try {
    const supabase = createAdminClient()

    // Fetch contact by portal token
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('portal_token', token)
      .is('archived_at', null)
      .single()

    if (contactError || !contact) {
      console.error('Error fetching contact by token:', contactError)
      return null
    }

    // Fetch organization name
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', contact.organization_id)
      .single()

    if (orgError || !organization) {
      console.error('Error fetching organization:', orgError)
      return null
    }

    // Fetch recent gifts (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const twelveMonthsAgoString = twelveMonthsAgo.toISOString().split('T')[0]

    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('gift_date', twelveMonthsAgoString)
      .order('gift_date', { ascending: false })

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError)
      // Continue without gifts rather than failing completely
    }

    return {
      contact: {
        ...contact,
        tags: contact.tags ?? [],
        is_donor: contact.is_donor ?? false,
        is_volunteer: contact.is_volunteer ?? false,
        address: contact.address as Contact['address'],
      },
      gifts: gifts || [],
      organization: {
        name: organization.name,
      },
    }
  } catch (error) {
    console.error('Error in getDonorByToken:', error)
    return null
  }
}
