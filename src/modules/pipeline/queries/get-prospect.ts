import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { PipelineProspect } from './get-prospects-by-stage'

export interface CultivationMove {
  id: string
  prospect_id: string
  move_type: string
  move_date: string
  description: string | null
  outcome: string | null
  next_step: string | null
  logged_by: string | null
  created_at: string
  logged_by_user: {
    id: string
    name: string
    email: string
  } | null
}

export interface ProspectWithMoves extends PipelineProspect {
  cultivation_moves: CultivationMove[]
}

/**
 * Fetches a single prospect with all details including cultivation moves
 */
export async function getProspect(prospectId: string): Promise<ProspectWithMoves | null> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    throw new Error('No organization found')
  }

  const { data: prospect, error } = await supabase
    .from('major_gift_prospects')
    .select(`
      *,
      contact:contacts!major_gift_prospects_contact_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone,
        lifetime_giving
      ),
      assigned_user:users!major_gift_prospects_assigned_to_fkey (
        id,
        name,
        email
      ),
      cultivation_moves (
        *,
        logged_by_user:users!cultivation_moves_logged_by_fkey (
          id,
          name,
          email
        )
      )
    `)
    .eq('id', prospectId)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching prospect:', error)
    return null
  }

  return prospect as ProspectWithMoves
}

/**
 * Check if a contact is already in the pipeline
 */
export async function isContactInPipeline(contactId: string): Promise<boolean> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return false
  }

  const { data, error } = await supabase
    .from('major_gift_prospects')
    .select('id')
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
    .single()

  return !!data && !error
}

/**
 * Get prospect ID for a contact
 */
export async function getProspectByContactId(contactId: string): Promise<string | null> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return null
  }

  const { data, error } = await supabase
    .from('major_gift_prospects')
    .select('id')
    .eq('contact_id', contactId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !data) {
    return null
  }

  return data.id
}
