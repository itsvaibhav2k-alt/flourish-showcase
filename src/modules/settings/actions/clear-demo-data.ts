'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface ClearDemoDataResult {
  success: boolean
  error?: string
  message?: string
}

/**
 * Clears all data for the current organization
 * Only works if the organization has the 'demo-data' tag on contacts
 */
export async function clearDemoData(): Promise<ClearDemoDataResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    // Get the current user
    const userClient = await createClient()
    const { data: { user }, error: userError } = await userClient.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to clear demo data' }
    }

    const supabase = await createClient()

    // Check user role using admin client
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return {
        success: false,
        error: 'Permission denied. Only administrators can clear demo data.',
      }
    }

    // Check if organization has demo data (contacts with 'demo-data' tag)
    const { data: demoContacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .contains('tags', ['demo-data'])

    if (!demoContacts || demoContacts.length === 0) {
      return {
        success: false,
        error: 'No demo data found. This action only works with demo data.'
      }
    }

    // Delete all data for the organization
    // Due to foreign key constraints, we need to delete in the right order

    // 1. Delete activities
    await supabase
      .from('activities')
      .delete()
      .eq('organization_id', organizationId)

    // 2. Delete email drafts
    await supabase
      .from('email_drafts')
      .delete()
      .eq('organization_id', organizationId)

    // 3. Delete shift signups (via shifts)
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('organization_id', organizationId)

    if (shifts && shifts.length > 0) {
      const shiftIds = shifts.map(s => s.id)
      await supabase
        .from('shift_signups')
        .delete()
        .in('shift_id', shiftIds)
    }

    // 4. Delete shifts
    await supabase
      .from('shifts')
      .delete()
      .eq('organization_id', organizationId)

    // 5. Delete gifts
    await supabase
      .from('gifts')
      .delete()
      .eq('organization_id', organizationId)

    // 6. Delete contact notes
    await supabase
      .from('contact_notes')
      .delete()
      .eq('organization_id', organizationId)

    // 7. Delete contact tasks
    await supabase
      .from('contact_tasks')
      .delete()
      .eq('organization_id', organizationId)

    // 8. Delete contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .eq('organization_id', organizationId)

    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
      return { success: false, error: 'Failed to clear all data' }
    }

    return {
      success: true,
      message: 'All demo data has been cleared successfully.'
    }
  } catch (error) {
    console.error('Error clearing demo data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
