'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { MoveType } from '../schemas/pipeline.schema'

export interface MoveWithUser {
  id: string
  prospect_id: string
  move_type: MoveType
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

/**
 * Server function to fetch all cultivation moves for a prospect
 * Returns moves sorted by move_date DESC (most recent first)
 */
export async function getMoves(prospectId: string): Promise<MoveWithUser[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('cultivation_moves')
      .select(`
        id,
        prospect_id,
        move_type,
        move_date,
        description,
        outcome,
        next_step,
        logged_by,
        created_at,
        logged_by_user:users!cultivation_moves_logged_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('prospect_id', prospectId)
      .eq('organization_id', organizationId)
      .order('move_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cultivation moves:', error)
      throw new Error('Failed to fetch cultivation moves')
    }

    return (data as any as MoveWithUser[]) || []
  } catch (error) {
    console.error('Error in getMoves:', error)
    throw error
  }
}

/**
 * Server function to fetch recent moves across all prospects
 * Useful for activity feeds or dashboards
 */
export async function getRecentMoves(limit: number = 10): Promise<MoveWithUser[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('cultivation_moves')
      .select(`
        id,
        prospect_id,
        move_type,
        move_date,
        description,
        outcome,
        next_step,
        logged_by,
        created_at,
        logged_by_user:users!cultivation_moves_logged_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent moves:', error)
      throw new Error('Failed to fetch recent moves')
    }

    return (data as any as MoveWithUser[]) || []
  } catch (error) {
    console.error('Error in getRecentMoves:', error)
    throw error
  }
}

/**
 * Server function to get move statistics for a prospect
 */
export async function getMoveStats(prospectId: string): Promise<{
  total_moves: number
  last_move_date: string | null
  move_type_breakdown: Record<MoveType, number>
}> {
  try {
    const moves = await getMoves(prospectId)

    const stats = {
      total_moves: moves.length,
      last_move_date: moves.length > 0 ? moves[0].move_date : null,
      move_type_breakdown: {
        call: 0,
        meeting: 0,
        email: 0,
        event: 0,
        tour: 0,
        lunch: 0,
        gift: 0,
        proposal: 0,
        other: 0,
      } as Record<MoveType, number>,
    }

    for (const move of moves) {
      if (move.move_type in stats.move_type_breakdown) {
        stats.move_type_breakdown[move.move_type]++
      }
    }

    return stats
  } catch (error) {
    console.error('Error in getMoveStats:', error)
    throw error
  }
}
