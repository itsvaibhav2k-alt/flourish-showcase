/**
 * Get Copilot Actions Query
 *
 * Fetches pending AI-generated fundraising actions for the current organization.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface CopilotActionWithContact {
  id: string
  contact_id: string
  action_type: 'reach_out' | 'send_ask' | 're_engage' | 'thank' | 'follow_up'
  priority: number
  title: string
  description: string
  reasoning: string
  predicted_gift_amount: number | null
  predicted_success_rate: number
  optimal_timing: string
  preferred_channel: 'email' | 'phone' | 'mail' | 'in_person'
  donor_score: number
  donor_score_reasoning: string
  context_snapshot: {
    lifetimeGiving: number
    totalGifts: number
    lastGiftDate: string | null
    lastGiftAmount: number | null
    lapseRisk: string
    segment: string
  }
  status: 'pending' | 'completed' | 'dismissed'
  generated_at: string
  created_at: string

  // Contact details (joined)
  contact: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    lifetime_giving: number
    total_gifts: number
    last_gift_date: string | null
  }
}

/**
 * Get all pending copilot actions for the current organization
 */
export async function getCopilotActions(filters?: {
  actionType?: string
  minPriority?: number
  status?: 'pending' | 'completed' | 'dismissed'
}): Promise<CopilotActionWithContact[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    throw new Error('No organization selected')
  }

  const supabase = await createClient()

  let query = supabase
    .from('copilot_actions')
    .select(
      `
      *,
      contact:contacts(
        id,
        first_name,
        last_name,
        email,
        phone,
        lifetime_giving,
        total_gifts,
        last_gift_date
      )
    `
    )
    .eq('organization_id', organizationId)

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  } else {
    // Default to pending only
    query = query.eq('status', 'pending')
  }

  if (filters?.actionType) {
    query = query.eq('action_type', filters.actionType)
  }

  if (filters?.minPriority) {
    query = query.gte('priority', filters.minPriority)
  }

  // Order by priority (highest first)
  query = query.order('priority', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching copilot actions:', error)
    throw new Error(`Failed to fetch copilot actions: ${error.message}`)
  }

  return (data || []) as CopilotActionWithContact[]
}

/**
 * Get a single copilot action by ID
 */
export async function getCopilotAction(
  actionId: string
): Promise<CopilotActionWithContact | null> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    throw new Error('No organization selected')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('copilot_actions')
    .select(
      `
      *,
      contact:contacts(
        id,
        first_name,
        last_name,
        email,
        phone,
        lifetime_giving,
        total_gifts,
        last_gift_date
      )
    `
    )
    .eq('id', actionId)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching copilot action:', error)
    return null
  }

  return data as CopilotActionWithContact
}

/**
 * Get copilot action statistics
 */
export async function getCopilotActionStats(): Promise<{
  totalPending: number
  totalCompleted: number
  totalDismissed: number
  byActionType: Record<string, number>
  avgPriority: number
}> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    throw new Error('No organization selected')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('copilot_actions')
    .select('status, action_type, priority')
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching copilot action stats:', error)
    return {
      totalPending: 0,
      totalCompleted: 0,
      totalDismissed: 0,
      byActionType: {},
      avgPriority: 0,
    }
  }

  const stats = {
    totalPending: data.filter(a => a.status === 'pending').length,
    totalCompleted: data.filter(a => a.status === 'completed').length,
    totalDismissed: data.filter(a => a.status === 'dismissed').length,
    byActionType: {} as Record<string, number>,
    avgPriority: 0,
  }

  // Count by action type
  data.forEach(action => {
    stats.byActionType[action.action_type] =
      (stats.byActionType[action.action_type] || 0) + 1
  })

  // Calculate average priority for pending actions
  const pendingActions = data.filter(a => a.status === 'pending')
  if (pendingActions.length > 0) {
    stats.avgPriority =
      pendingActions.reduce((sum, a) => sum + a.priority, 0) /
      pendingActions.length
  }

  return stats
}
