'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { PipelineStage } from '../schemas/pipeline.schema'

export interface StageHistoryEntry {
  id: string
  prospect_id: string
  from_stage: PipelineStage | null
  to_stage: PipelineStage
  changed_by: string | null
  notes: string | null
  created_at: string
  changed_by_user: {
    id: string
    name: string
    email: string
  } | null
}

export async function getStageHistory(prospectId: string): Promise<StageHistoryEntry[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('pipeline_stage_history')
      .select(`
        id,
        prospect_id,
        from_stage,
        to_stage,
        changed_by,
        notes,
        created_at,
        changed_by_user:users!pipeline_stage_history_changed_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('prospect_id', prospectId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stage history:', error)
      throw new Error('Failed to fetch stage history')
    }

    return (data as any as StageHistoryEntry[]) || []
  } catch (error) {
    console.error('Error in getStageHistory:', error)
    throw error
  }
}

export async function getStageHistoryStats(prospectId: string) {
  try {
    const history = await getStageHistory(prospectId)

    if (history.length === 0) {
      return {
        totalTransitions: 0,
        daysInCurrentStage: 0,
        averageDaysPerStage: 0,
      }
    }

    const currentStageEntry = history[0]
    const daysInCurrentStage = Math.floor(
      (Date.now() - new Date(currentStageEntry.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate average days per stage (excluding current)
    let totalDays = 0
    for (let i = 0; i < history.length - 1; i++) {
      const current = new Date(history[i].created_at)
      const next = new Date(history[i + 1].created_at)
      const days = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
      totalDays += days
    }

    const averageDaysPerStage =
      history.length > 1 ? Math.round(totalDays / (history.length - 1)) : 0

    return {
      totalTransitions: history.length - 1, // Subtract initial entry
      daysInCurrentStage,
      averageDaysPerStage,
    }
  } catch (error) {
    console.error('Error in getStageHistoryStats:', error)
    return {
      totalTransitions: 0,
      daysInCurrentStage: 0,
      averageDaysPerStage: 0,
    }
  }
}
