'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Contact } from '../schemas/contact.schema'

export type MergePreview = {
  sourceContact: Contact
  targetContact: Contact
  fields: MergeFieldPreview[]
  relatedRecords: {
    gifts: number
    activities: number
    shiftSignups: number
    emailDrafts: number
    notes: number
    tasks: number
  }
}

export type MergeFieldPreview = {
  field: string
  label: string
  sourceValue: unknown
  targetValue: unknown
  selectedSource: 'source' | 'target'
}

export type MergeResult = {
  success: boolean
  mergedContactId?: string
  error?: string
}

/**
 * Get preview of what will happen when merging two contacts
 */
export async function getMergePreview(
  sourceId: string,
  targetId: string
): Promise<{ success: boolean; preview?: MergePreview; error?: string }> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    // Fetch both contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .in('id', [sourceId, targetId])
      .is('archived_at', null)

    if (contactsError || !contacts || contacts.length !== 2) {
      return { success: false, error: 'Could not find both contacts' }
    }

    const sourceContact = contacts.find(c => c.id === sourceId) as Contact
    const targetContact = contacts.find(c => c.id === targetId) as Contact

    if (!sourceContact || !targetContact) {
      return { success: false, error: 'Could not find both contacts' }
    }

    // Count related records for source contact
    const [giftsResult, activitiesResult, signupsResult, emailsResult, notesResult, tasksResult] =
      await Promise.all([
        supabase.from('gifts').select('id', { count: 'exact' }).eq('contact_id', sourceId),
        supabase.from('activities').select('id', { count: 'exact' }).eq('contact_id', sourceId),
        supabase.from('shift_signups').select('id', { count: 'exact' }).eq('contact_id', sourceId),
        supabase.from('email_drafts').select('id', { count: 'exact' }).eq('contact_id', sourceId),
        supabase.from('notes').select('id', { count: 'exact' }).eq('contact_id', sourceId),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('contact_id', sourceId),
      ])

    // Build field comparison
    const fields: MergeFieldPreview[] = [
      {
        field: 'first_name',
        label: 'First Name',
        sourceValue: sourceContact.first_name,
        targetValue: targetContact.first_name,
        selectedSource: 'target',
      },
      {
        field: 'last_name',
        label: 'Last Name',
        sourceValue: sourceContact.last_name,
        targetValue: targetContact.last_name,
        selectedSource: 'target',
      },
      {
        field: 'email',
        label: 'Email',
        sourceValue: sourceContact.email,
        targetValue: targetContact.email,
        selectedSource: targetContact.email ? 'target' : 'source',
      },
      {
        field: 'phone',
        label: 'Phone',
        sourceValue: sourceContact.phone,
        targetValue: targetContact.phone,
        selectedSource: targetContact.phone ? 'target' : 'source',
      },
      {
        field: 'address',
        label: 'Address',
        sourceValue: sourceContact.address,
        targetValue: targetContact.address,
        selectedSource: targetContact.address?.street ? 'target' : 'source',
      },
    ]

    const preview: MergePreview = {
      sourceContact,
      targetContact,
      fields,
      relatedRecords: {
        gifts: giftsResult.count || 0,
        activities: activitiesResult.count || 0,
        shiftSignups: signupsResult.count || 0,
        emailDrafts: emailsResult.count || 0,
        notes: notesResult.count || 0,
        tasks: tasksResult.count || 0,
      },
    }

    return { success: true, preview }
  } catch (error) {
    console.error('Error getting merge preview:', error)
    return { success: false, error: 'Failed to get merge preview' }
  }
}

/**
 * Merge two contacts - moves all data from source to target and archives source
 * Uses the safe_merge_contacts RPC function for atomic, transactional merging
 */
export async function mergeContacts(
  sourceId: string,
  targetId: string,
  fieldOverrides?: Record<string, unknown>
): Promise<MergeResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    if (sourceId === targetId) {
      return { success: false, error: 'Cannot merge a contact with itself' }
    }

    const supabase = await createClient()

    // Use the safe_merge_contacts RPC function for atomic merging
    const { data: mergeResult, error: mergeError } = await supabase.rpc('safe_merge_contacts', {
      p_source_id: sourceId,
      p_target_id: targetId,
      p_org_id: organizationId
    })

    if (mergeError || !mergeResult?.success) {
      return {
        success: false,
        error: mergeResult?.error || mergeError?.message || 'Failed to merge contacts'
      }
    }

    // Apply field overrides if provided (after the atomic merge)
    if (fieldOverrides && Object.keys(fieldOverrides).length > 0) {
      const updates: Record<string, unknown> = {}
      for (const [field, value] of Object.entries(fieldOverrides)) {
        if (value !== undefined && value !== null && value !== '') {
          updates[field] = value
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updates)
          .eq('id', targetId)
          .eq('organization_id', organizationId)

        if (updateError) {
          console.error('Error applying field overrides after merge:', updateError)
          // Don't fail the merge, just log the error - the core merge succeeded
        }
      }
    }

    return { success: true, mergedContactId: targetId }
  } catch (error) {
    console.error('Error merging contacts:', error)
    return { success: false, error: 'Failed to merge contacts' }
  }
}
