'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateNoteSchema, type UpdateNoteInput } from '../schemas/task.schema'

export type UpdateNoteResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server action to update an existing note
 */
export async function updateNote(input: UpdateNoteInput): Promise<UpdateNoteResult> {
  try {
    // Validate input
    const validatedData = updateNoteSchema.parse(input)

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

    // Verify note exists and belongs to this organization
    const { data: existingNote, error: noteError } = await supabase
      .from('contact_notes')
      .select('id, contact_id')
      .eq('id', validatedData.noteId)
      .eq('organization_id', organizationId)
      .single()

    if (noteError || !existingNote) {
      return { success: false, error: 'Note not found' }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content
    }
    if (validatedData.noteType !== undefined) {
      updateData.note_type = validatedData.noteType
    }
    if (validatedData.importance !== undefined) {
      updateData.importance = validatedData.importance
    }
    if (validatedData.isPinned !== undefined) {
      updateData.is_pinned = validatedData.isPinned
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags
    }
    if (validatedData.linkedGiftId !== undefined) {
      updateData.linked_gift_id = validatedData.linkedGiftId
    }
    if (validatedData.linkedShiftId !== undefined) {
      updateData.linked_shift_id = validatedData.linkedShiftId
    }
    if (validatedData.interactionDate !== undefined) {
      updateData.interaction_date = validatedData.interactionDate
    }

    // Update note
    const { error: updateError } = await supabase
      .from('contact_notes')
      .update(updateData)
      .eq('id', validatedData.noteId)

    if (updateError) {
      console.error('Error updating note:', updateError)
      return { success: false, error: 'Failed to update note' }
    }

    // Revalidate relevant paths
    revalidatePath(`/contacts/${existingNote.contact_id}`)
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Error updating note:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
