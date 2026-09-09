'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import {
  createGrantSchema,
  updateGrantSchema,
  type CreateGrantInput,
  type UpdateGrantInput,
  type GrantStatus,
  type ActionResult,
} from '../schemas/grant.schema'

/**
 * Create a new grant application
 */
export async function createGrant(
  input: CreateGrantInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = createGrantSchema.parse(input)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data, error } = await supabase
      .from('grant_applications')
      .insert({
        organization_id: organizationId,
        funder_name: validated.funderName,
        grant_name: validated.grantName || null,
        amount_requested: validated.amountRequested || null,
        deadline: validated.deadline || null,
        notes: validated.notes || null,
        status: 'draft',
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating grant:', error)
      return { success: false, error: 'Failed to create grant application' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Error creating grant:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update an existing grant application
 */
export async function updateGrant(input: UpdateGrantInput): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = updateGrantSchema.parse(input)

    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (validated.funderName !== undefined) updateData.funder_name = validated.funderName
    if (validated.grantName !== undefined) updateData.grant_name = validated.grantName
    if (validated.amountRequested !== undefined) updateData.amount_requested = validated.amountRequested
    if (validated.amountAwarded !== undefined) updateData.amount_awarded = validated.amountAwarded
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.deadline !== undefined) updateData.deadline = validated.deadline
    if (validated.submittedAt !== undefined) updateData.submitted_at = validated.submittedAt
    if (validated.decisionAt !== undefined) updateData.decision_at = validated.decisionAt
    if (validated.reportingDue !== undefined) updateData.reporting_due = validated.reportingDue
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const { error } = await supabase
      .from('grant_applications')
      .update(updateData)
      .eq('id', validated.id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating grant:', error)
      return { success: false, error: 'Failed to update grant application' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true }
  } catch (error) {
    console.error('Error updating grant:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a grant application
 */
export async function deleteGrant(id: string): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('grant_applications')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting grant:', error)
      return { success: false, error: 'Failed to delete grant application' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true }
  } catch (error) {
    console.error('Error deleting grant:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Submit a grant application
 */
export async function submitGrant(id: string): Promise<ActionResult> {
  return updateGrant({
    id,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  })
}

/**
 * Mark grant as approved
 */
export async function approveGrant(
  id: string,
  amountAwarded: number,
  reportingDue?: string
): Promise<ActionResult> {
  return updateGrant({
    id,
    status: 'reporting',
    amountAwarded,
    decisionAt: new Date().toISOString(),
    reportingDue: reportingDue || null,
  })
}

/**
 * Mark grant as declined
 */
export async function declineGrant(id: string): Promise<ActionResult> {
  return updateGrant({
    id,
    status: 'declined',
    decisionAt: new Date().toISOString(),
  })
}

/**
 * Update grant status
 */
export async function updateGrantStatus(id: string, status: GrantStatus): Promise<ActionResult> {
  return updateGrant({ id, status })
}
