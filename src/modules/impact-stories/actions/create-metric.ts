/**
 * Create Impact Metric Action
 *
 * Server action to create a new impact metric
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createMetricSchema } from '../schemas'
import { revalidatePath } from 'next/cache'

export interface CreateMetricResult {
  success: boolean
  metricId?: string
  error?: string
}

/**
 * Create a new impact metric
 */
export async function createMetric(
  organizationId: string,
  data: unknown
): Promise<CreateMetricResult> {
  try {
    // Validate input
    const parsed = createMetricSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || 'Invalid input',
      }
    }

    const supabase = await createClient()

    // Verify user has access to this organization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return { success: false, error: 'Access denied to this organization' }
    }

    // Create the metric
    const { data: metric, error: createError } = await supabase
      .from('impact_metrics')
      .insert({
        organization_id: organizationId,
        ...parsed.data,
      })
      .select('id')
      .single()

    if (createError || !metric) {
      console.error('Error creating impact metric:', createError)
      return { success: false, error: 'Failed to create impact metric' }
    }

    // Revalidate the metrics page
    revalidatePath(`/flora/impact-stories`)

    return {
      success: true,
      metricId: metric.id,
    }
  } catch (error) {
    console.error('Create metric error:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create metric. Please try again.',
    }
  }
}
