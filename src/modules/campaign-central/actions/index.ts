'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { revalidatePath } from 'next/cache'
import {
  createCampaignSchema,
  updateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from '../schemas/campaign.schema'

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  input: CreateCampaignInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = createCampaignSchema.parse(input)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: validated.name,
        description: validated.description || null,
        campaign_type: validated.campaignType,
        goal_amount: validated.goalAmount || null,
        start_date: validated.startDate || null,
        end_date: validated.endDate || null,
        status: 'planning',
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return { success: false, error: 'Failed to create campaign' }
    }

    revalidatePath('/addon/campaign-central')
    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Error creating campaign:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(input: UpdateCampaignInput): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const validated = updateCampaignSchema.parse(input)

    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.campaignType !== undefined) updateData.campaign_type = validated.campaignType
    if (validated.goalAmount !== undefined) updateData.goal_amount = validated.goalAmount
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.startDate !== undefined) updateData.start_date = validated.startDate
    if (validated.endDate !== undefined) updateData.end_date = validated.endDate

    const { error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', validated.id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating campaign:', error)
      return { success: false, error: 'Failed to update campaign' }
    }

    revalidatePath('/addon/campaign-central')
    return { success: true }
  } catch (error) {
    console.error('Error updating campaign:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting campaign:', error)
      return { success: false, error: 'Failed to delete campaign' }
    }

    revalidatePath('/addon/campaign-central')
    return { success: true }
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Link a gift to a campaign
 */
export async function linkGiftToCampaign(
  campaignId: string,
  giftId: string
): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    // Verify campaign belongs to org
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single()

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    // Link the gift
    const { error } = await supabase.from('campaign_gifts').insert({
      campaign_id: campaignId,
      gift_id: giftId,
    })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return { success: false, error: 'Gift is already linked to this campaign' }
      }
      console.error('Error linking gift to campaign:', error)
      return { success: false, error: 'Failed to link gift' }
    }

    revalidatePath('/addon/campaign-central')
    return { success: true }
  } catch (error) {
    console.error('Error linking gift to campaign:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Unlink a gift from a campaign
 */
export async function unlinkGiftFromCampaign(
  campaignId: string,
  giftId: string
): Promise<ActionResult> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('campaign_gifts')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('gift_id', giftId)

    if (error) {
      console.error('Error unlinking gift from campaign:', error)
      return { success: false, error: 'Failed to unlink gift' }
    }

    revalidatePath('/addon/campaign-central')
    return { success: true }
  } catch (error) {
    console.error('Error unlinking gift from campaign:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Bulk link gifts to a campaign
 */
export async function bulkLinkGiftsToCampaign(
  campaignId: string,
  giftIds: string[]
): Promise<ActionResult<{ linked: number; failed: number }>> {
  try {
    const organizationId = await getCurrentOrganizationId()

    if (!organizationId) {
      return { success: false, error: 'No organization found' }
    }

    if (giftIds.length === 0) {
      return { success: true, data: { linked: 0, failed: 0 } }
    }

    const supabase = await createClient()

    // Verify campaign belongs to org
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single()

    if (!campaign) {
      return { success: false, error: 'Campaign not found' }
    }

    // Link all gifts (ignore duplicates)
    const links = giftIds.map((giftId) => ({
      campaign_id: campaignId,
      gift_id: giftId,
    }))

    const { data, error } = await supabase
      .from('campaign_gifts')
      .upsert(links, { onConflict: 'campaign_id,gift_id', ignoreDuplicates: true })
      .select()

    if (error) {
      console.error('Error bulk linking gifts:', error)
      return { success: false, error: 'Failed to link gifts' }
    }

    revalidatePath('/addon/campaign-central')
    return {
      success: true,
      data: {
        linked: data?.length || 0,
        failed: giftIds.length - (data?.length || 0),
      },
    }
  } catch (error) {
    console.error('Error bulk linking gifts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  id: string,
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<ActionResult> {
  return updateCampaign({ id, status })
}
