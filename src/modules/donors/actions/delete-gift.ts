'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logGiftActivity } from '@/lib/activity'

export type DeleteGiftResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Server action to delete a gift
 */
export async function deleteGift(giftId: string): Promise<DeleteGiftResult> {
  try {
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

    // Get gift details before deleting
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('contact_id, amount, gift_type')
      .eq('id', giftId)
      .eq('organization_id', organizationId)
      .single()

    if (giftError || !gift) {
      return { success: false, error: 'Gift not found' }
    }

    // Soft delete gift by setting archived_at
    const { error: deleteError } = await supabase
      .from('gifts')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user.id
      })
      .eq('id', giftId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      return { success: false, error: 'Failed to archive gift' }
    }

    // Check if contact still has active (non-archived) gifts
    const { data: remainingGifts, error: remainingError } = await supabase
      .from('gifts')
      .select('id')
      .eq('contact_id', gift.contact_id)
      .is('archived_at', null)
      .limit(1)

    if (!remainingError && remainingGifts.length === 0) {
      // No more active gifts, update is_donor flag
      await supabase
        .from('contacts')
        .update({ is_donor: false })
        .eq('id', gift.contact_id)
    }

    // Log activity
    await logGiftActivity({
      organizationId,
      contactId: gift.contact_id,
      giftId,
      amount: gift.amount,
      giftType: gift.gift_type,
      action: 'archived',
    })

    // Revalidate relevant paths
    revalidatePath('/donors')
    revalidatePath(`/donors/${gift.contact_id}`)

    return { success: true }
  } catch (error) {
    console.error('Error deleting gift:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred' }
  }
}
