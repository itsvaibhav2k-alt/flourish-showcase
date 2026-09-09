'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { updateContactSchema, type UpdateContactInput } from '../schemas/contact.schema'
import { logContactActivity } from '@/lib/activity'

type ActionResult = {
  success: boolean
  error?: string
}

export async function updateContact(
  contactId: string,
  input: UpdateContactInput,
  expectedVersion?: number
): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = updateContactSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (validatedData.first_name !== undefined) updateData.first_name = validatedData.first_name
    if (validatedData.last_name !== undefined) updateData.last_name = validatedData.last_name
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.is_donor !== undefined) updateData.is_donor = validatedData.is_donor
    if (validatedData.is_volunteer !== undefined) updateData.is_volunteer = validatedData.is_volunteer

    // Build update query with optimistic locking if version provided
    let query = supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    // Add version check for optimistic locking
    if (expectedVersion !== undefined) {
      query = query.eq('version', expectedVersion)
    }

    const { data, error, count } = await query.select('id').maybeSingle()

    if (error) {
      console.error('Error updating contact:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Check if no rows were updated (version mismatch or contact not found)
    if (!data) {
      if (expectedVersion !== undefined) {
        return {
          success: false,
          error: 'Contact was modified by another user. Please refresh and try again.',
        }
      }
      return {
        success: false,
        error: 'Contact not found or you do not have permission to update it.',
      }
    }

    // Log activity
    await logContactActivity({
      organizationId,
      contactId,
      action: 'updated',
      changes: updateData,
    })

    // Revalidate paths
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in updateContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    }
  }
}
