'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

type ActionResult = {
  success: boolean
  error?: string
}

/**
 * Soft deletes a contact by setting the archived_at timestamp.
 * The contact will no longer appear in regular queries but can be recovered if needed.
 */
export async function deleteContact(contactId: string): Promise<ActionResult> {
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

    // Soft delete by setting archived_at
    const { error } = await supabase
      .from('contacts')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting contact:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    }
  }
}

/**
 * Restores a soft-deleted contact by clearing the archived_at timestamp.
 */
export async function restoreContact(contactId: string): Promise<ActionResult> {
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

    // Restore by clearing archived_at
    const { error } = await supabase
      .from('contacts')
      .update({ archived_at: null })
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error restoring contact:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate paths
    revalidatePath('/contacts')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in restoreContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore contact',
    }
  }
}
