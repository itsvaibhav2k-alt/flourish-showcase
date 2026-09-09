/**
 * Get Impact Metrics Query
 *
 * Fetches impact metrics for an organization
 */

import { createClient } from '@/lib/supabase/server'
import type { ImpactMetric } from '../schemas'

export interface GetMetricsParams {
  organizationId: string
  activeOnly?: boolean
}

/**
 * Get all impact metrics for an organization
 */
export async function getMetrics(
  params: GetMetricsParams
): Promise<ImpactMetric[]> {
  const { organizationId, activeOnly = false } = params

  const supabase = await createClient()

  let query = supabase
    .from('impact_metrics')
    .select('*')
    .eq('organization_id', organizationId)
    .order('display_order')
    .order('created_at')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    // Return empty array if table doesn't exist yet (feature not set up)
    if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
      console.warn('Impact metrics table not found - returning empty array')
      return []
    }
    console.error('Error fetching impact metrics:', error)
    throw new Error('Failed to fetch impact metrics')
  }

  return (data || []) as ImpactMetric[]
}

/**
 * Get a single impact metric by ID
 */
export async function getMetricById(metricId: string): Promise<ImpactMetric | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('impact_metrics')
    .select('*')
    .eq('id', metricId)
    .single()

  if (error) {
    console.error('Error fetching impact metric:', error)
    return null
  }

  return data as ImpactMetric
}
