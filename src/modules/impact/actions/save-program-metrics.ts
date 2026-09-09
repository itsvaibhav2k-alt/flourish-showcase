'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createProgramMetricSchema,
  type CreateProgramMetricInput,
} from '../schemas/impact.schema'

export type SaveProgramMetricResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action to create or update program metric
 * - Validates input with Zod schema
 * - Uses upsert on program_name + metric_name + time_period to avoid duplicates
 * - Requires organization membership
 * - Revalidates relevant paths
 */
export async function saveProgramMetric(
  input: CreateProgramMetricInput
): Promise<SaveProgramMetricResult> {
  try {
    // Validate input
    const validatedData = createProgramMetricSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Check if a metric with this combination exists
    const { data: existingMetric } = await supabase
      .from('program_metrics')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('program_name', validatedData.program_name)
      .eq('metric_name', validatedData.metric_name)
      .eq('time_period', validatedData.time_period)
      .maybeSingle()

    let result

    if (existingMetric) {
      // Update existing metric
      const { data, error } = await supabase
        .from('program_metrics')
        .update({
          metric_value: validatedData.metric_value,
          cost_per_unit: validatedData.cost_per_unit,
          description: validatedData.description ?? null,
          icon: validatedData.icon ?? null,
        })
        .eq('id', existingMetric.id)
        .select('id')
        .single()

      if (error) {
        console.error('Supabase program_metrics update error:', error)
        return {
          success: false,
          error: error.message || 'Failed to update program metric',
        }
      }

      result = data
    } else {
      // Insert new metric
      const { data, error } = await supabase
        .from('program_metrics')
        .insert({
          organization_id: organizationId,
          program_name: validatedData.program_name,
          metric_name: validatedData.metric_name,
          metric_value: validatedData.metric_value,
          cost_per_unit: validatedData.cost_per_unit,
          time_period: validatedData.time_period,
          description: validatedData.description ?? null,
          icon: validatedData.icon ?? null,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Supabase program_metrics insert error:', error)
        return {
          success: false,
          error: error.message || 'Failed to save program metric',
        }
      }

      result = data
    }

    if (!result) {
      return {
        success: false,
        error: 'Failed to save program metric',
      }
    }

    // Revalidate relevant paths
    revalidatePath('/impact')
    revalidatePath('/settings')
    revalidatePath('/')

    return { success: true, id: result.id }
  } catch (error) {
    console.error('Error saving program metric:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to delete program metric
 */
export async function deleteProgramMetric(
  id: string
): Promise<SaveProgramMetricResult> {
  try {
    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Delete the program metric
    const { error: deleteError } = await supabase
      .from('program_metrics')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting program metric:', deleteError)
      return { success: false, error: 'Failed to delete program metric' }
    }

    // Revalidate relevant paths
    revalidatePath('/impact')
    revalidatePath('/settings')
    revalidatePath('/')

    return { success: true, id }
  } catch (error) {
    console.error('Error in deleteProgramMetric:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
