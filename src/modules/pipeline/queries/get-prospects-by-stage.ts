import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { PipelineStage } from '../schemas/pipeline.schema'

export interface PipelineProspect {
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
  outcome: string
  notes: string | null
  created_at: string
  updated_at: string
  contact: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    lifetime_giving: number | null
  }
  assigned_user: {
    id: string
    name: string
    email: string
  } | null
}

/**
 * Fetches all prospects grouped by pipeline stage
 */
export async function getProspectsByStage(): Promise<Record<PipelineStage, PipelineProspect[]>> {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    throw new Error('No organization found')
  }

  const { data: prospects, error } = await supabase
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
      )
    `)
    .eq('organization_id', organizationId)
    .order('readiness_score', { ascending: false })

  if (error) {
    console.error('Error fetching prospects:', error)
    throw error
  }

  // Group prospects by stage
  const prospectsByStage: Record<PipelineStage, PipelineProspect[]> = {
    identification: [],
    qualification: [],
    cultivation: [],
    solicitation: [],
    stewardship: [],
  }

  prospects?.forEach((prospect) => {
    const stage = prospect.stage as PipelineStage
    prospectsByStage[stage].push(prospect as PipelineProspect)
  })

  return prospectsByStage
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats() {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    throw new Error('No organization found')
  }

  const { data: prospects, error } = await supabase
    .from('major_gift_prospects')
    .select('stage, target_ask_amount, readiness_score')
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching pipeline stats:', error)
    return {
      totalProspects: 0,
      byStage: {
        identification: 0,
        qualification: 0,
        cultivation: 0,
        solicitation: 0,
        stewardship: 0,
      },
      totalTargetAmount: 0,
      averageReadiness: 0,
    }
  }

  const byStage = prospects.reduce((acc, p) => {
    const stage = p.stage as PipelineStage
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {} as Record<PipelineStage, number>)

  const totalTargetAmount = prospects.reduce(
    (sum, p) => sum + (p.target_ask_amount || 0),
    0
  )

  const readinessScores = prospects.filter((p) => p.readiness_score !== null)
  const averageReadiness =
    readinessScores.length > 0
      ? Math.round(
          readinessScores.reduce((sum, p) => sum + (p.readiness_score || 0), 0) /
            readinessScores.length
        )
      : 0

  return {
    totalProspects: prospects.length,
    byStage: {
      identification: byStage.identification || 0,
      qualification: byStage.qualification || 0,
      cultivation: byStage.cultivation || 0,
      solicitation: byStage.solicitation || 0,
      stewardship: byStage.stewardship || 0,
    },
    totalTargetAmount,
    averageReadiness,
  }
}
