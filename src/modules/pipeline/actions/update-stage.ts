'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { updateStageSchema, type UpdateStageInput } from '../schemas/pipeline.schema'
import { revalidatePath } from 'next/cache'

export async function updateProspectStage(input: UpdateStageInput) {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, error: 'No organization found' }
  }

  // Validate input
  const validation = updateStageSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }

  // Update prospect stage
  const { data, error } = await supabase
    .from('major_gift_prospects')
    .update({
      stage: input.new_stage,
      stage_entered_at: new Date().toISOString(),
      notes: input.notes || undefined,
    })
    .eq('id', input.prospect_id)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating prospect stage:', error)
    return { success: false, error: 'Failed to update prospect stage' }
  }

  revalidatePath('/pipeline')
  revalidatePath(`/pipeline/${input.prospect_id}`)

  return { success: true, data }
}
