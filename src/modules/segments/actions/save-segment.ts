'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { createSegmentSchema, updateSegmentSchema, type CreateSegmentInput, type UpdateSegmentInput } from '../schemas/segment.schema'

type ActionResult = {
  success: boolean
  data?: { id: string }
  error?: string
}

/**
 * Create a new saved segment
 */
export async function createSegment(input: CreateSegmentInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = createSegmentSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Check if segment name already exists for this entity type
    const { data: existingSegment } = await supabase
      .from('saved_segments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', validatedData.entityType)
      .eq('name', validatedData.name)
      .single()

    if (existingSegment) {
      return {
        success: false,
        error: 'A segment with this name already exists',
      }
    }

    // Insert segment
    const { data, error } = await supabase
      .from('saved_segments')
      .insert({
        organization_id: organizationId,
        name: validatedData.name,
        entity_type: validatedData.entityType,
        filters: validatedData.filters,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating segment:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')
    revalidatePath('/donors')
    revalidatePath('/volunteers')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in createSegment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create segment',
    }
  }
}

/**
 * Update an existing segment
 */
export async function updateSegment(id: string, input: UpdateSegmentInput): Promise<ActionResult> {
  try {
    // Validate input
    const validatedData = updateSegmentSchema.parse(input)

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return {
        success: false,
        error: 'No organization selected',
      }
    }

    const supabase = await createClient()

    // Check if name is being changed and if it conflicts
    if (validatedData.name) {
      const { data: segment } = await supabase
        .from('saved_segments')
        .select('entity_type')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (segment) {
        const { data: existingSegment } = await supabase
          .from('saved_segments')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('entity_type', segment.entity_type)
          .eq('name', validatedData.name)
          .neq('id', id)
          .single()

        if (existingSegment) {
          return {
            success: false,
            error: 'A segment with this name already exists',
          }
        }
      }
    }

    // Update segment
    const { data, error } = await supabase
      .from('saved_segments')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('id')
      .single()

    if (error) {
      console.error('Error updating segment:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')
    revalidatePath('/donors')
    revalidatePath('/volunteers')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('Error in updateSegment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update segment',
    }
  }
}
