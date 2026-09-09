'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Delete a saved segment by ID
 */
export async function deleteSegment(id: string): Promise<ActionResult> {
  try {
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

    // Delete segment
    const { error } = await supabase
      .from('saved_segments')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting segment:', error)
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
    }
  } catch (error) {
    console.error('Error in deleteSegment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete segment',
    }
  }
}
