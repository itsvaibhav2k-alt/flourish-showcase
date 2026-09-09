'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export interface DonationStats {
  totalRaised: number
  donationCount: number
  averageGift: number
  recurringDonors: number
  completedThisMonth: number
  pendingCount: number
}

/**
 * Get aggregate donation statistics
 */
export async function getDonationStats(): Promise<DonationStats> {
  try {
    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      throw new Error('No organization selected')
    }

    const supabase = await createClient()

    // Get current month boundaries
    const now = new Date()
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get total raised (completed donations)
    const { data: completedDonations } = await supabase
      .from('donations')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')

    const totalRaised = completedDonations?.reduce((sum, d) => sum + d.amount, 0) || 0
    const donationCount = completedDonations?.length || 0

    // Get average gift
    const averageGift = donationCount > 0 ? totalRaised / donationCount : 0

    // Get recurring donors count
    const { count: recurringDonors } = await supabase
      .from('donations')
      .select('contact_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .eq('is_recurring', true)

    // Get completed this month
    const { count: completedThisMonth } = await supabase
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('created_at', firstDayOfThisMonth.toISOString())

    // Get pending donations count
    const { count: pendingCount } = await supabase
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')

    return {
      totalRaised: totalRaised / 100, // Convert from cents to dollars
      donationCount,
      averageGift: averageGift / 100, // Convert from cents to dollars
      recurringDonors: recurringDonors || 0,
      completedThisMonth: completedThisMonth || 0,
      pendingCount: pendingCount || 0,
    }
  } catch (error) {
    console.error('Error in getDonationStats:', error)
    throw error
  }
}
