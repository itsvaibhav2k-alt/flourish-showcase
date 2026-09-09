'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createSmartAskConfigSchema,
  type CreateSmartAskConfigInput,
} from '../schemas/smart-ask.schema'

export type SaveConfigResult =
  | { success: true; configId: string }
  | { success: false; error: string }

/**
 * Server action to save Smart Ask configuration for an organization
 * - Validates input
 * - Creates or updates config in Supabase
 * - Revalidates paths
 */
export async function saveSmartAskConfig(
  input: CreateSmartAskConfigInput
): Promise<SaveConfigResult> {
  try {
    // Validate input
    const validatedData = createSmartAskConfigSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('smart_ask_config')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle()

    let configId: string

    if (existingConfig) {
      // Update existing config
      const { data: updated, error: updateError } = await supabase
        .from('smart_ask_config')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id)
        .select('id')
        .single()

      if (updateError || !updated) {
        console.error('Supabase config update error:', updateError)
        return {
          success: false,
          error: updateError?.message || 'Failed to update configuration',
        }
      }

      configId = updated.id
    } else {
      // Create new config
      const { data: created, error: createError } = await supabase
        .from('smart_ask_config')
        .insert({
          organization_id: organizationId,
          ...validatedData,
        })
        .select('id')
        .single()

      if (createError || !created) {
        console.error('Supabase config insert error:', createError)
        return {
          success: false,
          error: createError?.message || 'Failed to create configuration',
        }
      }

      configId = created.id
    }

    // Revalidate relevant paths
    revalidatePath('/donors')
    revalidatePath('/smart-ask')

    return { success: true, configId }
  } catch (error) {
    console.error('Error saving smart ask config:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
