'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { MatchingGiftStatus } from '../schemas/matching-gift.schema'

export type UpdateMatchingGiftResult = {
  success: boolean
  error?: string
}

/**
 * Update the matching gift status for a gift
 */
export async function updateMatchingGiftStatus(
  giftId: string,
  status: MatchingGiftStatus,
  amount?: number
): Promise<UpdateMatchingGiftResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      matching_gift_status: status,
    }

    // Set received date if status is received
    if (status === 'received') {
      updateData.matching_gift_received_at = new Date().toISOString()
      if (amount !== undefined) {
        updateData.matching_gift_amount = amount
      }
    }

    const { error } = await supabase
      .from('gifts')
      .update(updateData)
      .eq('id', giftId)
      .eq('organization_id', organizationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating matching gift status:', error)
    return { success: false, error: 'Failed to update matching gift status' }
  }
}

/**
 * Mark matching gift as received with the actual amount
 */
export async function recordMatchingGiftReceived(
  giftId: string,
  amount: number
): Promise<UpdateMatchingGiftResult> {
  return updateMatchingGiftStatus(giftId, 'received', amount)
}

/**
 * Update organization's Double the Donation settings
 */
export async function updateMatchingGiftSettings(
  enabled: boolean,
  publicKey?: string
): Promise<UpdateMatchingGiftResult> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      return { success: false, error: 'No organization selected' }
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      matching_gifts_enabled: enabled,
    }

    if (publicKey !== undefined) {
      updateData.double_the_donation_public_key = publicKey
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating matching gift settings:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}
