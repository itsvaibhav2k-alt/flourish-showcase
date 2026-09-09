'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { togglePinNoteSchema, type TogglePinNoteInput } from '../schemas/task.schema'

export type TogglePinNoteResult =
  | { success: true; isPinned: boolean }
  | { success: false; error: string }

/**
 * Server action to toggle the pin status of a note
 */
export async function togglePinNote(input: TogglePinNoteInput): Promise<TogglePinNoteResult> {
  try {
    // Validate input
    const validatedData = togglePinNoteSchema.parse(input)

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

    // Get current note state
    const { data: note, error: noteError } = await supabase
      .from('contact_notes')
      .select('id, contact_id, is_pinned')
      .eq('id', validatedData.noteId)
      .eq('organization_id', organizationId)
      .single()

    if (noteError || !note) {
      return { success: false, error: 'Note not found' }
    }

    // Toggle pin status
    const newPinnedStatus = !note.is_pinned

    const { error: updateError } = await supabase
      .from('contact_notes')
      .update({ is_pinned: newPinnedStatus })
      .eq('id', validatedData.noteId)

    if (updateError) {
      console.error('Error toggling pin:', updateError)
      return { success: false, error: 'Failed to toggle pin status' }
    }

    // Revalidate relevant paths
    revalidatePath(`/contacts/${note.contact_id}`)
    revalidatePath('/contacts')

    return { success: true, isPinned: newPinnedStatus }
  } catch (error) {
    console.error('Error toggling pin:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
