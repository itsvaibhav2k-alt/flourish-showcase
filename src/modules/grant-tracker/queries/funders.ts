'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Funder, RelationshipStatus } from '../schemas/funder.schema'

/**
 * Get all funders for the current organization
 */
export async function getFunders(options?: {
  relationshipStatus?: RelationshipStatus
  limit?: number
}): Promise<Funder[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('funders')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (options?.relationshipStatus) {
    query = query.eq('relationship_status', options.relationshipStatus)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching funders:', error)
    return []
  }

  return (data || []).map(mapFunderRow)
}

/**
 * Get a single funder by ID
 */
export async function getFunderById(id: string): Promise<Funder | null> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('funders')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching funder:', error)
    throw new Error('Failed to fetch funder')
  }

  return mapFunderRow(data)
}

/**
 * Get funders with their grant history
 */
export async function getFundersWithGrants(): Promise<
  Array<
    Funder & {
      grantCount: number
      totalRequested: number
      totalAwarded: number
      activeGrants: number
    }
  >
> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('funders')
    .select(
      `
      *,
      grant_applications (
        id,
        amount_requested,
        amount_awarded,
        status
      )
    `
    )
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching funders with grants:', error)
    return []
  }

  return (data || []).map((row: any) => {
    const funder = mapFunderRow(row)
    const grants = row.grant_applications || []

    return {
      ...funder,
      grantCount: grants.length,
      totalRequested: grants.reduce(
        (sum: number, g: any) => sum + (g.amount_requested || 0),
        0
      ),
      totalAwarded: grants.reduce(
        (sum: number, g: any) => sum + (g.amount_awarded || 0),
        0
      ),
      activeGrants: grants.filter(
        (g: any) =>
          g.status === 'submitted' ||
          g.status === 'pending' ||
          g.status === 'approved' ||
          g.status === 'reporting'
      ).length,
    }
  })
}

/**
 * Search funders by name
 */
export async function searchFunders(searchQuery: string): Promise<Funder[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('funders')
    .select('*')
    .eq('organization_id', organizationId)
    .ilike('name', `%${searchQuery}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching funders:', error)
    throw new Error('Failed to search funders')
  }

  return (data || []).map(mapFunderRow)
}

// Helper function to map database row to Funder type
function mapFunderRow(row: any): Funder {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    type: row.type,
    website: row.website,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    notes: row.notes,
    focusAreas: row.focus_areas,
    geographicFocus: row.geographic_focus,
    averageGrantSize: row.average_grant_size,
    totalAwarded: row.total_awarded,
    relationshipStatus: row.relationship_status,
    lastContactDate: row.last_contact_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
