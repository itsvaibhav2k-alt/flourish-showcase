'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { PipelineStage } from '../schemas/pipeline.schema'

export interface ProspectWithContact {
  id: string
  contact_id: string
  stage: PipelineStage
  stage_entered_at: string
  target_ask_amount: number | null
  target_ask_date: string | null
  assigned_to: string | null
  readiness_score: number | null
  predicted_gift_amount: number | null
  recommended_ask_amount: number | null
  optimal_ask_timing: string | null
  next_move: string | null
  next_move_date: string | null
  actual_gift_amount: number | null
  outcome: string | null
  notes: string | null
  created_at: string
  updated_at: string
  contacts: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    lifetime_giving: number
  }
}

export interface PipelineByStage {
  identification: ProspectWithContact[]
  qualification: ProspectWithContact[]
  cultivation: ProspectWithContact[]
  solicitation: ProspectWithContact[]
  stewardship: ProspectWithContact[]
}

/**
 * Server function to fetch all prospects grouped by stage for Kanban view
 * Returns prospects organized by pipeline stage with contact information
 */
export async function getProspectsByStage(): Promise<PipelineByStage> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Fetch all prospects with contact data
    const { data, error } = await supabase
      .from('major_gift_prospects')
      .select(`
        id,
        contact_id,
        stage,
        stage_entered_at,
        target_ask_amount,
        target_ask_date,
        assigned_to,
        readiness_score,
        predicted_gift_amount,
        recommended_ask_amount,
        optimal_ask_timing,
        next_move,
        next_move_date,
        actual_gift_amount,
        outcome,
        notes,
        created_at,
        updated_at,
        contacts (
          id,
          first_name,
          last_name,
          email,
          lifetime_giving
        )
      `)
      .eq('organization_id', organizationId)
      .order('readiness_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching prospects:', error)
      throw new Error('Failed to fetch prospects')
    }

    // Group prospects by stage
    const pipeline: PipelineByStage = {
      identification: [],
      qualification: [],
      cultivation: [],
      solicitation: [],
      stewardship: [],
    }

    if (data) {
      for (const prospect of data) {
        const stage = prospect.stage as PipelineStage
        if (pipeline[stage]) {
          pipeline[stage].push(prospect as ProspectWithContact)
        }
      }
    }

    return pipeline
  } catch (error) {
    console.error('Error in getProspectsByStage:', error)
    throw error
  }
}

/**
 * Server function to fetch all prospects (not grouped)
 * Useful for table views or filtering
 */
export async function getAllProspects(): Promise<ProspectWithContact[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('major_gift_prospects')
      .select(`
        id,
        contact_id,
        stage,
        stage_entered_at,
        target_ask_amount,
        target_ask_date,
        assigned_to,
        readiness_score,
        predicted_gift_amount,
        recommended_ask_amount,
        optimal_ask_timing,
        next_move,
        next_move_date,
        actual_gift_amount,
        outcome,
        notes,
        created_at,
        updated_at,
        contacts (
          id,
          first_name,
          last_name,
          email,
          lifetime_giving
        )
      `)
      .eq('organization_id', organizationId)
      .order('readiness_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all prospects:', error)
      throw new Error('Failed to fetch prospects')
    }

    return (data as ProspectWithContact[]) || []
  } catch (error) {
    console.error('Error in getAllProspects:', error)
    throw error
  }
}
