'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateGiftSchema, type UpdateGiftInput } from '../schemas/gift.schema'
import { logGiftActivity } from '@/lib/activity'

export type UpdateGiftResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server action to update an existing gift
 */
export async function updateGift(
  giftId: string,
  input: UpdateGiftInput
): Promise<UpdateGiftResult> {
  try {
    // Validate input
    const validatedData = updateGiftSchema.parse(input)

    const supabase = await createClient()

    // Get current user and organization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return { success: false, error: 'Organization not found' }
    }

    const organizationId = memberData.organization_id

    // Verify gift belongs to this organization and get contact_id
    const { data: existingGift, error: giftError } = await supabase
      .from('gifts')
      .select('contact_id, amount, gift_type')
      .eq('id', giftId)
      .eq('organization_id', organizationId)
      .single()

    if (giftError || !existingGift) {
      return { success: false, error: 'Gift not found' }
    }

    // Update gift
    const { error: updateError } = await supabase
      .from('gifts')
      .update(validatedData)
      .eq('id', giftId)

    if (updateError) {
      return { success: false, error: 'Failed to update gift' }
    }

    // Log activity
    await logGiftActivity({
      organizationId,
      contactId: existingGift.contact_id,
      giftId,
      amount: validatedData.amount ?? existingGift.amount,
      giftType: validatedData.gift_type ?? existingGift.gift_type,
      action: 'updated',
    })

    // Revalidate relevant paths
    revalidatePath('/donors')
    revalidatePath(`/donors/${existingGift.contact_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating gift:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
