import { getDonations, type GetDonationsResult } from '@/modules/donations/queries/get-donations'
import { getDonationStats, type DonationStats } from '@/modules/donations/queries/get-donations'
import { DonationsPageClient } from './DonationsPageClient'

export const dynamic = 'force-dynamic'

/**
 * Donations management page
 * Shows donation statistics and recent donations
 */
export default async function DonationsPage() {
  // Fetch stats and donations in parallel with error handling
  const [stats, donationsResult] = await Promise.all([
    getDonationStats().catch((): DonationStats => ({
      total_donations: 0,
      total_amount: 0,
      average_donation: 0,
      completed_donations: 0,
      pending_donations: 0,
      failed_donations: 0,
      monthly_recurring: 0,
      one_time_donations: 0,
    })),
    getDonations({ limit: 50 }).catch((): GetDonationsResult => ({
      donations: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    })),
  ])

  return <DonationsPageClient stats={stats} donationsResult={donationsResult} />
}
