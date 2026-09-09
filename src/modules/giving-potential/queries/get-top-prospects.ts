'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface TopProspect {
  id: string
  contact_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  lifetime_giving: number
  gift_count: number
  capacity_score: number | null
  affinity_score: number | null
  propensity_score: number | null
  overall_score: number | null
  estimated_net_worth: number | null
  giving_gap_ratio: number | null
  last_enriched_at: string | null
}

export interface GetTopProspectsOptions {
  limit?: number
  minScore?: number
  includeUnscored?: boolean
}

/**
 * Server function to fetch top prospects by overall_score
 * Includes contact data and giving history
 * Sorted by overall_score DESC
 */
export async function getTopProspects(
  options: GetTopProspectsOptions = {}
): Promise<TopProspect[]> {
  const { limit = 20, minScore = 0, includeUnscored = false } = options

  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Build the query
    let query = supabase
      .from('giving_potential')
      .select(
        `
        id,
        contact_id,
        capacity_score,
        affinity_score,
        propensity_score,
        overall_score,
        estimated_net_worth,
        giving_gap_ratio,
        last_enriched_at,
        contacts!inner (
          first_name,
          last_name,
          email,
          phone,
          lifetime_giving,
          total_gifts
        )
      `
      )
      .eq('organization_id', organizationId)

    // Filter by minimum score
    if (!includeUnscored) {
      query = query.not('overall_score', 'is', null)
      if (minScore > 0) {
        query = query.gte('overall_score', minScore)
      }
    }

    // Sort by overall_score DESC (nulls last)
    query = query.order('overall_score', { ascending: false, nullsFirst: false })

    // Limit results
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching top prospects:', error)
      throw new Error('Failed to fetch top prospects')
    }

    if (!data) {
      return []
    }

    // Transform the data to flatten the contact relationship
    const prospects: TopProspect[] = data.map((row: any) => ({
      id: row.id,
      contact_id: row.contact_id,
      first_name: row.contacts.first_name,
      last_name: row.contacts.last_name,
      email: row.contacts.email,
      phone: row.contacts.phone,
      lifetime_giving: row.contacts.lifetime_giving || 0,
      gift_count: row.contacts.total_gifts || 0,
      capacity_score: row.capacity_score,
      affinity_score: row.affinity_score,
      propensity_score: row.propensity_score,
      overall_score: row.overall_score,
      estimated_net_worth: row.estimated_net_worth,
      giving_gap_ratio: row.giving_gap_ratio,
      last_enriched_at: row.last_enriched_at,
    }))

    return prospects
  } catch (error) {
    console.error('Error in getTopProspects:', error)
    throw error
  }
}

/**
 * Get prospects by capacity score (high capacity, regardless of current giving)
 */
export async function getHighCapacityProspects(
  options: GetTopProspectsOptions = {}
): Promise<TopProspect[]> {
  const { limit = 20, minScore = 60 } = options

  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('giving_potential')
      .select(
        `
        id,
        contact_id,
        capacity_score,
        affinity_score,
        propensity_score,
        overall_score,
        estimated_net_worth,
        giving_gap_ratio,
        last_enriched_at,
        contacts!inner (
          first_name,
          last_name,
          email,
          phone,
          lifetime_giving,
          total_gifts
        )
      `
      )
      .eq('organization_id', organizationId)
      .not('capacity_score', 'is', null)
      .gte('capacity_score', minScore)
      .order('capacity_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching high capacity prospects:', error)
      throw new Error('Failed to fetch high capacity prospects')
    }

    if (!data) {
      return []
    }

    const prospects: TopProspect[] = data.map((row: any) => ({
      id: row.id,
      contact_id: row.contact_id,
      first_name: row.contacts.first_name,
      last_name: row.contacts.last_name,
      email: row.contacts.email,
      phone: row.contacts.phone,
      lifetime_giving: row.contacts.lifetime_giving || 0,
      gift_count: row.contacts.total_gifts || 0,
      capacity_score: row.capacity_score,
      affinity_score: row.affinity_score,
      propensity_score: row.propensity_score,
      overall_score: row.overall_score,
      estimated_net_worth: row.estimated_net_worth,
      giving_gap_ratio: row.giving_gap_ratio,
      last_enriched_at: row.last_enriched_at,
    }))

    return prospects
  } catch (error) {
    console.error('Error in getHighCapacityProspects:', error)
    throw error
  }
}

/**
 * Get prospects with high giving gap (high capacity but low current giving)
 */
export async function getUntappedProspects(
  options: GetTopProspectsOptions = {}
): Promise<TopProspect[]> {
  const { limit = 20, minScore = 60 } = options

  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Get prospects with high capacity but low giving gap ratio (giving less than capacity)
    const { data, error } = await supabase
      .from('giving_potential')
      .select(
        `
        id,
        contact_id,
        capacity_score,
        affinity_score,
        propensity_score,
        overall_score,
        estimated_net_worth,
        giving_gap_ratio,
        last_enriched_at,
        contacts!inner (
          first_name,
          last_name,
          email,
          phone,
          lifetime_giving,
          total_gifts
        )
      `
      )
      .eq('organization_id', organizationId)
      .not('capacity_score', 'is', null)
      .gte('capacity_score', minScore)
      .not('giving_gap_ratio', 'is', null)
      .lt('giving_gap_ratio', 0.1) // Giving less than 10% of capacity
      .order('capacity_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching untapped prospects:', error)
      throw new Error('Failed to fetch untapped prospects')
    }

    if (!data) {
      return []
    }

    const prospects: TopProspect[] = data.map((row: any) => ({
      id: row.id,
      contact_id: row.contact_id,
      first_name: row.contacts.first_name,
      last_name: row.contacts.last_name,
      email: row.contacts.email,
      phone: row.contacts.phone,
      lifetime_giving: row.contacts.lifetime_giving || 0,
      gift_count: row.contacts.total_gifts || 0,
      capacity_score: row.capacity_score,
      affinity_score: row.affinity_score,
      propensity_score: row.propensity_score,
      overall_score: row.overall_score,
      estimated_net_worth: row.estimated_net_worth,
      giving_gap_ratio: row.giving_gap_ratio,
      last_enriched_at: row.last_enriched_at,
    }))

    return prospects
  } catch (error) {
    console.error('Error in getUntappedProspects:', error)
    throw error
  }
}
