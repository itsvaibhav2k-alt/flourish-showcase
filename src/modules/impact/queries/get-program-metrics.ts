'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface ProgramMetricData {
  id: string
  organization_id: string
  program_name: string
  metric_name: string
  metric_value: number
  cost_per_unit: number
  time_period: string
  description: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

/**
 * Server function to fetch program metrics for the current organization
 * Optionally filter by time period
 */
export async function getProgramMetrics(
  timePeriod?: string
): Promise<ProgramMetricData[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Build query
    let query = supabase
      .from('program_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('program_name', { ascending: true })
      .order('metric_name', { ascending: true })

    // Filter by time period if provided
    if (timePeriod) {
      query = query.eq('time_period', timePeriod)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching program metrics:', error)
      throw new Error('Failed to fetch program metrics')
    }

    return data || []
  } catch (error) {
    console.error('Error in getProgramMetrics:', error)
    throw error
  }
}

/**
 * Server function to fetch program metrics grouped by program name
 */
export async function getProgramMetricsGrouped(
  timePeriod?: string
): Promise<Record<string, ProgramMetricData[]>> {
  try {
    const metrics = await getProgramMetrics(timePeriod)

    // Group by program_name
    const grouped: Record<string, ProgramMetricData[]> = {}

    metrics.forEach((metric) => {
      if (!grouped[metric.program_name]) {
        grouped[metric.program_name] = []
      }
      grouped[metric.program_name].push(metric)
    })

    return grouped
  } catch (error) {
    console.error('Error in getProgramMetricsGrouped:', error)
    throw error
  }
}

/**
 * Server function to get available time periods for program metrics
 */
export async function getAvailableTimePeriods(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    const { data, error } = await supabase
      .from('program_metrics')
      .select('time_period')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching time periods:', error)
      throw new Error('Failed to fetch time periods')
    }

    // Extract unique time periods
    const uniquePeriods = Array.from(
      new Set(data.map((row) => row.time_period))
    ).sort() as string[]

    return uniquePeriods
  } catch (error) {
    console.error('Error in getAvailableTimePeriods:', error)
    throw error
  }
}
