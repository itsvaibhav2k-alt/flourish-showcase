'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { BulkActionResult } from '../types/bulk-actions'

/**
 * Add tags to multiple contacts
 */
export async function bulkAddTags(
  contactIds: string[],
  tagsToAdd: string[]
): Promise<BulkActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, affectedCount: 0, error: 'No organization selected' }
    }

    if (contactIds.length === 0 || tagsToAdd.length === 0) {
      return { success: false, affectedCount: 0, error: 'No contacts or tags selected' }
    }

    const supabase = await createClient()

    // Get current contacts with their tags
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, tags')
      .eq('organization_id', organizationId)
      .in('id', contactIds)

    if (fetchError) {
      return { success: false, affectedCount: 0, error: fetchError.message }
    }

    // Update each contact with merged tags
    let affectedCount = 0
    for (const contact of contacts || []) {
      const existingTags = contact.tags || []
      const newTags = [...new Set([...existingTags, ...tagsToAdd])]

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ tags: newTags })
        .eq('id', contact.id)
        .eq('organization_id', organizationId)

      if (!updateError) {
        affectedCount++
      }
    }

    return { success: true, affectedCount }
  } catch (error) {
    console.error('Error in bulkAddTags:', error)
    return { success: false, affectedCount: 0, error: 'Failed to add tags' }
  }
}

/**
 * Remove tags from multiple contacts
 */
export async function bulkRemoveTags(
  contactIds: string[],
  tagsToRemove: string[]
): Promise<BulkActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, affectedCount: 0, error: 'No organization selected' }
    }

    if (contactIds.length === 0 || tagsToRemove.length === 0) {
      return { success: false, affectedCount: 0, error: 'No contacts or tags selected' }
    }

    const supabase = await createClient()

    // Get current contacts with their tags
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id, tags')
      .eq('organization_id', organizationId)
      .in('id', contactIds)

    if (fetchError) {
      return { success: false, affectedCount: 0, error: fetchError.message }
    }

    // Update each contact with filtered tags
    let affectedCount = 0
    for (const contact of contacts || []) {
      const existingTags = contact.tags || []
      const newTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag))

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ tags: newTags })
        .eq('id', contact.id)
        .eq('organization_id', organizationId)

      if (!updateError) {
        affectedCount++
      }
    }

    return { success: true, affectedCount }
  } catch (error) {
    console.error('Error in bulkRemoveTags:', error)
    return { success: false, affectedCount: 0, error: 'Failed to remove tags' }
  }
}

/**
 * Delete multiple contacts (archive them)
 */
export async function bulkDeleteContacts(
  contactIds: string[]
): Promise<BulkActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, affectedCount: 0, error: 'No organization selected' }
    }

    if (contactIds.length === 0) {
      return { success: false, affectedCount: 0, error: 'No contacts selected' }
    }

    const supabase = await createClient()

    // Archive contacts instead of hard delete
    const { error, count } = await supabase
      .from('contacts')
      .update({ archived_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .in('id', contactIds)

    if (error) {
      return { success: false, affectedCount: 0, error: error.message }
    }

    return { success: true, affectedCount: count || contactIds.length }
  } catch (error) {
    console.error('Error in bulkDeleteContacts:', error)
    return { success: false, affectedCount: 0, error: 'Failed to delete contacts' }
  }
}

/**
 * Get all unique tags in the organization for tag selection
 */
export async function getOrganizationTags(): Promise<string[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return []
    }

    const supabase = await createClient()

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('tags')
      .eq('organization_id', organizationId)
      .is('archived_at', null)

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    // Extract all unique tags
    const allTags = new Set<string>()
    for (const contact of contacts || []) {
      for (const tag of contact.tags || []) {
        allTags.add(tag)
      }
    }

    return Array.from(allTags).sort()
  } catch (error) {
    console.error('Error in getOrganizationTags:', error)
    return []
  }
}
