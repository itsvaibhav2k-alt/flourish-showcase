'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { prospectSchema, type ProspectInput } from '../schemas/pipeline.schema'
import { revalidatePath } from 'next/cache'

export async function addToPipeline(input: ProspectInput) {
  const supabase = await createClient()
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    return { success: false, error: 'No organization found' }
  }

  // Validate input
  const validation = prospectSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }

  // Check if contact is already in pipeline
  const { data: existing } = await supabase
    .from('major_gift_prospects')
    .select('id')
    .eq('contact_id', input.contact_id)
    .eq('organization_id', organizationId)
    .single()

  if (existing) {
    return { success: false, error: 'Contact is already in the pipeline' }
  }

  // Create prospect
  const { data, error } = await supabase
    .from('major_gift_prospects')
    .insert({
      ...input,
      organization_id: organizationId,
      stage_entered_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding prospect to pipeline:', error)
    return { success: false, error: 'Failed to add prospect to pipeline' }
  }

  revalidatePath('/pipeline')
  revalidatePath(`/contacts/${input.contact_id}`)

  return { success: true, data }
}
