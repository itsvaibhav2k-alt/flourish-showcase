'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { ContactNote, NoteType, NoteImportance } from '../schemas/task.schema'

export interface GetNotesOptions {
  contactId: string
  noteType?: NoteType | 'all'
  importance?: NoteImportance | 'all'
  searchQuery?: string
  tags?: string[]
  pinnedOnly?: boolean
  limit?: number
  offset?: number
}

export interface GetNotesResult {
  notes: ContactNote[]
  pinnedNotes: ContactNote[]
  totalCount: number
}

/**
 * Get notes for a specific contact with filtering and sorting.
 * Returns pinned notes separately for easy display at top.
 */
export async function getNotes(contactId: string): Promise<ContactNote[]>
export async function getNotes(options: GetNotesOptions): Promise<GetNotesResult>
export async function getNotes(
  contactIdOrOptions: string | GetNotesOptions
): Promise<ContactNote[] | GetNotesResult> {
  try {
    // Handle simple string parameter (backward compatibility)
    if (typeof contactIdOrOptions === 'string') {
      return getNotesSimple(contactIdOrOptions)
    }

    const options = contactIdOrOptions

    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('contact_notes')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('contact_id', options.contactId)

    // Apply filters
    if (options.noteType && options.noteType !== 'all') {
      query = query.eq('note_type', options.noteType)
    }

    if (options.importance && options.importance !== 'all') {
      query = query.eq('importance', options.importance)
    }

    if (options.pinnedOnly) {
      query = query.eq('is_pinned', true)
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags)
    }

    if (options.searchQuery) {
      // Escape special ILIKE characters to prevent unexpected wildcard behavior
      const escapedQuery = options.searchQuery.replace(/[%_\\]/g, '\\$&')
      query = query.ilike('content', `%${escapedQuery}%`)
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    // Order by pinned first, then by created_at
    query = query.order('is_pinned', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const { data: notes, error, count } = await query

    if (error) {
      console.error('Error fetching notes:', error)
      throw new Error(error.message)
    }

    const allNotes = (notes || []) as ContactNote[]
    const pinnedNotes = allNotes.filter(note => note.is_pinned)
    const unpinnedNotes = allNotes.filter(note => !note.is_pinned)

    return {
      notes: unpinnedNotes,
      pinnedNotes,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Error in getNotes:', error)
    throw error
  }
}

/**
 * Simple version for backward compatibility
 */
async function getNotesSimple(contactId: string): Promise<ContactNote[]> {
  try {
    // Get current organization
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    // Create Supabase client
    const supabase = await createClient()

    // Fetch notes ordered by pinned first, then by date
    const { data: notes, error } = await supabase
      .from('contact_notes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      throw new Error(error.message)
    }

    return (notes || []) as ContactNote[]
  } catch (error) {
    console.error('Error in getNotesSimple:', error)
    throw error
  }
}

/**
 * Get all unique tags used in notes for a contact
 */
export async function getNoteTags(contactId: string): Promise<string[]> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    const { data: notes, error } = await supabase
      .from('contact_notes')
      .select('tags')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)

    if (error) {
      console.error('Error fetching note tags:', error)
      return []
    }

    // Extract unique tags from all notes
    const allTags = new Set<string>()
    notes?.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  } catch (error) {
    console.error('Error in getNoteTags:', error)
    return []
  }
}
