'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { Campaign, CampaignStatus } from '../schemas/campaign.schema'

export interface CampaignWithStats extends Campaign {
  progressPercent: number
  daysRemaining: number | null
  isOverdue: boolean
}

/**
 * Get all campaigns for the current organization
 */
export async function getCampaigns(options?: {
  status?: CampaignStatus
  limit?: number
}): Promise<CampaignWithStats[]> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching campaigns:', error)
    throw new Error('Failed to fetch campaigns')
  }

  return (data || []).map(mapCampaignRow)
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(id: string): Promise<CampaignWithStats | null> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching campaign:', error)
    throw new Error('Failed to fetch campaign')
  }

  return mapCampaignRow(data)
}

/**
 * Get campaign statistics summary
 */
export async function getCampaignStats(): Promise<{
  total: number
  active: number
  totalGoal: number
  totalRaised: number
  totalDonors: number
}> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return { total: 0, active: 0, totalGoal: 0, totalRaised: 0, totalDonors: 0 }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('status, goal_amount, raised_amount, donor_count')
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching campaign stats:', error)
    return { total: 0, active: 0, totalGoal: 0, totalRaised: 0, totalDonors: 0 }
  }

  const campaigns = data || []
  const activeCampaigns = campaigns.filter((c) => c.status === 'active')

  return {
    total: campaigns.length,
    active: activeCampaigns.length,
    totalGoal: activeCampaigns.reduce((sum, c) => sum + (c.goal_amount || 0), 0),
    totalRaised: activeCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0),
    totalDonors: activeCampaigns.reduce((sum, c) => sum + (c.donor_count || 0), 0),
  }
}

/**
 * Get gifts linked to a campaign
 */
export async function getCampaignGifts(campaignId: string): Promise<
  Array<{
    id: string
    amount: number
    giftDate: string
    donorName: string
    donorId: string
  }>
> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaign_gifts')
    .select(`
      id,
      gift:gifts (
        id,
        amount,
        gift_date,
        contact:contacts (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('Error fetching campaign gifts:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.gift?.id,
    amount: row.gift?.amount || 0,
    giftDate: row.gift?.gift_date,
    donorName: `${row.gift?.contact?.first_name || ''} ${row.gift?.contact?.last_name || ''}`.trim() || 'Unknown',
    donorId: row.gift?.contact?.id,
  }))
}

/**
 * Get available gifts that can be linked to a campaign
 */
export async function getAvailableGiftsForCampaign(
  campaignId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<
  Array<{
    id: string
    amount: number
    giftDate: string
    donorName: string
    donorId: string
    alreadyLinked: boolean
  }>
> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    return []
  }

  const supabase = await createClient()

  // Get campaign date range
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('start_date, end_date')
    .eq('id', campaignId)
    .single()

  const startDate = options?.startDate || campaign?.start_date
  const endDate = options?.endDate || campaign?.end_date

  // Get gifts within the campaign period
  let giftsQuery = supabase
    .from('gifts')
    .select(`
      id,
      amount,
      gift_date,
      contact:contacts (
        id,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .order('gift_date', { ascending: false })

  if (startDate) {
    giftsQuery = giftsQuery.gte('gift_date', startDate)
  }
  if (endDate) {
    giftsQuery = giftsQuery.lte('gift_date', endDate)
  }
  if (options?.limit) {
    giftsQuery = giftsQuery.limit(options.limit)
  }

  const { data: gifts, error: giftsError } = await giftsQuery

  if (giftsError) {
    console.error('Error fetching gifts:', giftsError)
    return []
  }

  // Get already linked gift IDs
  const { data: linkedGifts } = await supabase
    .from('campaign_gifts')
    .select('gift_id')
    .eq('campaign_id', campaignId)

  const linkedGiftIds = new Set((linkedGifts || []).map((lg) => lg.gift_id))

  return (gifts || []).map((gift: any) => ({
    id: gift.id,
    amount: gift.amount || 0,
    giftDate: gift.gift_date,
    donorName: `${gift.contact?.first_name || ''} ${gift.contact?.last_name || ''}`.trim() || 'Unknown',
    donorId: gift.contact?.id,
    alreadyLinked: linkedGiftIds.has(gift.id),
  }))
}

// Helper function to map database row to Campaign type
function mapCampaignRow(row: any): CampaignWithStats {
  const now = new Date()
  const endDate = row.end_date ? new Date(row.end_date) : null
  const goalAmount = row.goal_amount || 0
  const raisedAmount = row.raised_amount || 0

  const progressPercent = goalAmount > 0 ? Math.min(100, (raisedAmount / goalAmount) * 100) : 0

  let daysRemaining: number | null = null
  let isOverdue = false

  if (endDate && row.status === 'active') {
    const diffTime = endDate.getTime() - now.getTime()
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isOverdue = daysRemaining < 0
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    campaignType: row.campaign_type,
    goalAmount: row.goal_amount,
    raisedAmount: row.raised_amount || 0,
    donorCount: row.donor_count || 0,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    targetAudience: row.target_audience,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progressPercent,
    daysRemaining,
    isOverdue,
  }
}
