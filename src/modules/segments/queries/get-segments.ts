'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Segment, EntityType } from '../schemas/segment.schema'

export type GetSegmentsParams = {
  entityType?: EntityType
}

/**
 * Get all saved segments for the current organization
 * Optionally filter by entity type
 */
export async function getSegments(
  params: GetSegmentsParams = {}
): Promise<Segment[]> {
  const { entityType } = params

  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('saved_segments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    // Apply entity type filter if provided
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      console.error('Error fetching segments:', error)
      throw new Error(error.message)
    }

    return (data as Segment[]) || []
  } catch (error) {
    console.error('Error in getSegments:', error)
    throw error
  }
}

/**
 * Get a single segment by ID
 */
export async function getSegmentById(id: string): Promise<Segment | null> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch segment
    const { data, error } = await supabase
      .from('saved_segments')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching segment:', error)
      throw new Error(error.message)
    }

    return data as Segment
  } catch (error) {
    console.error('Error in getSegmentById:', error)
    throw error
  }
}
