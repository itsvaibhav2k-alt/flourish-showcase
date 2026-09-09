'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { deleteNoteSchema, type DeleteNoteInput } from '../schemas/task.schema'

export type DeleteNoteResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server action to delete a note
 */
export async function deleteNote(input: DeleteNoteInput): Promise<DeleteNoteResult> {
  try {
    // Validate input
    const validatedData = deleteNoteSchema.parse(input)

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

    // Get note to verify ownership and get contact_id for revalidation
    const { data: note, error: noteError } = await supabase
      .from('contact_notes')
      .select('id, contact_id')
      .eq('id', validatedData.noteId)
      .eq('organization_id', organizationId)
      .single()

    if (noteError || !note) {
      return { success: false, error: 'Note not found' }
    }

    // Delete note
    const { error: deleteError } = await supabase
      .from('contact_notes')
      .delete()
      .eq('id', validatedData.noteId)

    if (deleteError) {
      console.error('Error deleting note:', deleteError)
      return { success: false, error: 'Failed to delete note' }
    }

    // Revalidate relevant paths
    revalidatePath(`/contacts/${note.contact_id}`)
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
