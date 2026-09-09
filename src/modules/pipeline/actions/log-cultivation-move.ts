'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { cultivationMoveSchema, type CultivationMoveInput } from '../schemas/pipeline.schema'
import { revalidatePath } from 'next/cache'

export async function logCultivationMove(input: CultivationMoveInput) {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, error: 'No organization found' }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Validate input
  const validation = cultivationMoveSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }

  // Create cultivation move
  const { data, error } = await supabase
    .from('cultivation_moves')
    .insert({
      ...input,
      organization_id: organizationId,
      logged_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging cultivation move:', error)
    return { success: false, error: 'Failed to log cultivation move' }
  }

  revalidatePath(`/pipeline/${input.prospect_id}`)

  return { success: true, data }
}
