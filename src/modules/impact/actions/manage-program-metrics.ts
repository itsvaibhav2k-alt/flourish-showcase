'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import type { CreateProgramMetricInput, UpdateProgramMetricInput } from '../schemas/impact-story.schema'

/**
 * Creates a new program metric
 */
export async function createProgramMetric(input: CreateProgramMetricInput) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'Organization not found' }
    }

    const { data, error } = await supabase
      .from('program_metrics')
      .insert({
        organization_id: organizationId,
        program_name: input.programName,
        metric_name: input.metricName,
        metric_value: input.metricValue,
        cost_per_unit: input.costPerUnit,
        time_period: input.timePeriod,
        description: input.description,
        icon: input.icon,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating program metric:', error)
      return { success: false, error: 'Failed to create program metric' }
    }

    revalidatePath('/settings/impact')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createProgramMetric:', error)
    return { success: false, error: 'Failed to create program metric' }
  }
}

/**
 * Updates an existing program metric
 */
export async function updateProgramMetric(input: UpdateProgramMetricInput) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'Organization not found' }
    }

    const updateData: Record<string, any> = {}
    if (input.programName !== undefined) updateData.program_name = input.programName
    if (input.metricName !== undefined) updateData.metric_name = input.metricName
    if (input.metricValue !== undefined) updateData.metric_value = input.metricValue
    if (input.costPerUnit !== undefined) updateData.cost_per_unit = input.costPerUnit
    if (input.timePeriod !== undefined) updateData.time_period = input.timePeriod
    if (input.description !== undefined) updateData.description = input.description
    if (input.icon !== undefined) updateData.icon = input.icon

    const { data, error } = await supabase
      .from('program_metrics')
      .update(updateData)
      .eq('id', input.id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating program metric:', error)
      return { success: false, error: 'Failed to update program metric' }
    }

    revalidatePath('/settings/impact')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateProgramMetric:', error)
    return { success: false, error: 'Failed to update program metric' }
  }
}

/**
 * Deletes a program metric
 */
export async function deleteProgramMetric(id: string) {
  try {
    const supabase = await createClient()
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'Organization not found' }
    }

    const { error } = await supabase
      .from('program_metrics')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting program metric:', error)
      return { success: false, error: 'Failed to delete program metric' }
    }

    revalidatePath('/settings/impact')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProgramMetric:', error)
    return { success: false, error: 'Failed to delete program metric' }
  }
}
