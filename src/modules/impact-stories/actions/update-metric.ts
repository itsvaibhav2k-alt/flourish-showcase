/**
 * Update Impact Metric Action
 *
 * Server action to update an existing impact metric
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { updateMetricSchema } from '../schemas'
import { revalidatePath } from 'next/cache'

export interface UpdateMetricResult {
  success: boolean
  error?: string
}

/**
 * Update an existing impact metric
 */
export async function updateMetric(
  metricId: string,
  data: unknown
): Promise<UpdateMetricResult> {
  try {
    // Validate input
    const parsed = updateMetricSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      }
    }

    const supabase = await createClient()

    // Verify user has access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get the metric to verify ownership
    const { data: metric, error: metricError } = await supabase
      .from('impact_metrics')
      .select('organization_id')
      .eq('id', metricId)
      .single()

    if (metricError || !metric) {
      return { success: false, error: 'Metric not found' }
    }

    // Verify user has access to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', metric.organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return { success: false, error: 'Access denied' }
    }

    // Update the metric
    const { error: updateError } = await supabase
      .from('impact_metrics')
      .update(parsed.data)
      .eq('id', metricId)

    if (updateError) {
      console.error('Error updating impact metric:', updateError)
      return { success: false, error: 'Failed to update impact metric' }
    }

    // Revalidate the metrics page
    revalidatePath(`/flora/impact-stories`)

    return { success: true }
  } catch (error) {
    console.error('Update metric error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update metric. Please try again.',
    }
  }
}
