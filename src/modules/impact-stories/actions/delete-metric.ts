/**
 * Delete Impact Metric Action
 *
 * Server action to delete an impact metric
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DeleteMetricResult {
  success: boolean
  error?: string
}

/**
 * Delete an impact metric
 */
export async function deleteMetric(metricId: string): Promise<DeleteMetricResult> {
  try {
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

    // Delete the metric
    const { error: deleteError } = await supabase
      .from('impact_metrics')
      .delete()
      .eq('id', metricId)

    if (deleteError) {
      console.error('Error deleting impact metric:', deleteError)
      return { success: false, error: 'Failed to delete impact metric' }
    }

    // Revalidate the metrics page
    revalidatePath(`/flora/impact-stories`)

    return { success: true }
  } catch (error) {
    console.error('Delete metric error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete metric. Please try again.',
    }
  }
}
