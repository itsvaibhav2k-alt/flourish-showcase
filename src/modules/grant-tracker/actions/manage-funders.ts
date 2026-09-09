'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import {
  createFunderSchema,
  updateFunderSchema,
  type CreateFunderInput,
  type UpdateFunderInput,
} from '../schemas/funder.schema'
import type { ActionResult } from '../schemas/grant.schema'

/**
 * Create a new funder
 */
export async function createFunder(
  input: CreateFunderInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = createFunderSchema.parse(input)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data, error } = await supabase
      .from('funders')
      .insert({
        organization_id: organizationId,
        name: validated.name,
        type: validated.type || null,
        website: validated.website || null,
        contact_name: validated.contactName || null,
        contact_email: validated.contactEmail || null,
        contact_phone: validated.contactPhone || null,
        notes: validated.notes || null,
        focus_areas: validated.focusAreas || null,
        geographic_focus: validated.geographicFocus || null,
        average_grant_size: validated.averageGrantSize || null,
        relationship_status: validated.relationshipStatus || 'prospect',
        last_contact_date: validated.lastContactDate || null,
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating funder:', error)
      return { success: false, error: 'Failed to create funder' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Error creating funder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update an existing funder
 */
export async function updateFunder(
  input: UpdateFunderInput
): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = updateFunderSchema.parse(input)

    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.website !== undefined)
      updateData.website = validated.website || null
    if (validated.contactName !== undefined)
      updateData.contact_name = validated.contactName
    if (validated.contactEmail !== undefined)
      updateData.contact_email = validated.contactEmail
    if (validated.contactPhone !== undefined)
      updateData.contact_phone = validated.contactPhone
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.focusAreas !== undefined)
      updateData.focus_areas = validated.focusAreas
    if (validated.geographicFocus !== undefined)
      updateData.geographic_focus = validated.geographicFocus
    if (validated.averageGrantSize !== undefined)
      updateData.average_grant_size = validated.averageGrantSize
    if (validated.relationshipStatus !== undefined)
      updateData.relationship_status = validated.relationshipStatus
    if (validated.lastContactDate !== undefined)
      updateData.last_contact_date = validated.lastContactDate

    const { error } = await supabase
      .from('funders')
      .update(updateData)
      .eq('id', validated.id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating funder:', error)
      return { success: false, error: 'Failed to update funder' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true }
  } catch (error) {
    console.error('Error updating funder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a funder
 */
export async function deleteFunder(id: string): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('funders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting funder:', error)
      return { success: false, error: 'Failed to delete funder' }
    }

    revalidatePath('/addon/grant-tracker')
    return { success: true }
  } catch (error) {
    console.error('Error deleting funder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
