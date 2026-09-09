'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createNoteSchema, type CreateNoteInput } from '../schemas/task.schema'
import { logActivity } from '@/lib/activity'

export type CreateNoteResult =
  | { success: true; noteId: string }
  | { success: false; error: string }

/**
 * Server action to create a new note for a contact
 * - Validates input
 * - Inserts note into Supabase
 * - Logs activity
 * - Revalidates paths
 */
export async function createNote(input: CreateNoteInput): Promise<CreateNoteResult> {
  try {
    // Validate input
    const validatedData = createNoteSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify contact belongs to this organization
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedData.contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Verify linked gift if provided
    if (validatedData.linkedGiftId) {
      const { data: gift, error: giftError } = await supabase
        .from('gifts')
        .select('id')
        .eq('id', validatedData.linkedGiftId)
        .eq('organization_id', organizationId)
        .single()

      if (giftError || !gift) {
        return { success: false, error: 'Linked gift not found' }
      }
    }

    // Verify linked shift if provided
    if (validatedData.linkedShiftId) {
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('id')
        .eq('id', validatedData.linkedShiftId)
        .eq('organization_id', organizationId)
        .single()

      if (shiftError || !shift) {
        return { success: false, error: 'Linked shift not found' }
      }
    }

    // Insert note with enhanced fields
    const { data: note, error: noteError } = await supabase
      .from('contact_notes')
      .insert({
        organization_id: organizationId,
        contact_id: validatedData.contactId,
        content: validatedData.content,
        note_type: validatedData.noteType,
        importance: validatedData.importance,
        is_pinned: validatedData.isPinned,
        tags: validatedData.tags,
        linked_gift_id: validatedData.linkedGiftId || null,
        linked_shift_id: validatedData.linkedShiftId || null,
        interaction_date: validatedData.interactionDate || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (noteError || !note) {
      console.error('Error inserting note:', noteError)
      return { success: false, error: 'Failed to create note' }
    }

    // Log activity
    await logActivity({
      organizationId,
      contactId: validatedData.contactId,
      activityType: 'note_added',
      description: `Note added: ${validatedData.content.substring(0, 100)}${validatedData.content.length > 100 ? '...' : ''}`,
      metadata: {
        note_id: note.id,
        note_type: validatedData.noteType,
        importance: validatedData.importance,
        tags: validatedData.tags,
      },
    })

    // Revalidate relevant paths
    revalidatePath(`/contacts/${validatedData.contactId}`)
    revalidatePath('/contacts')

    return { success: true, noteId: note.id }
  } catch (error) {
    console.error('Error creating note:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
