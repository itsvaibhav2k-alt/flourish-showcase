'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface GivingPotentialData {
  id: string
  contact_id: string
  organization_id: string
  estimated_net_worth: number | null
  real_estate_value: number | null
  stock_holdings: number | null
  political_donations: number | null
  nonprofit_board_count: number
  employer: string | null
  job_title: string | null
  capacity_score: number | null
  affinity_score: number | null
  propensity_score: number | null
  overall_score: number | null
  giving_gap_ratio: number | null
  data_sources: Record<string, any>
  notes: string | null
  last_enriched_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Server function to fetch giving potential data for a single contact
 */
export async function getGivingPotential(
  contactId: string
): Promise<GivingPotentialData | null> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Fetch giving potential data
    const { data, error } = await supabase
      .from('giving_potential')
      .select('*')
      .eq('contact_id', contactId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching giving potential:', error)
      throw new Error('Failed to fetch giving potential data')
    }

    return data
  } catch (error) {
    console.error('Error in getGivingPotential:', error)
    throw error
  }
}

/**
 * Server function to check if a contact has giving potential data
 */
export async function hasGivingPotential(contactId: string): Promise<boolean> {
  try {
    const data = await getGivingPotential(contactId)
    return data !== null
  } catch (error) {
    console.error('Error in hasGivingPotential:', error)
    return false
  }
}
