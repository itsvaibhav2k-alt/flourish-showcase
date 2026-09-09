export const dynamic = 'force-dynamic'
import { getDonors, type DonorSegment, type DonorWithStats } from '@/modules/donors/queries/get-donors'
import { getDonorStats, type DonorStats } from '@/modules/donors/queries/get-donor-stats'
import { getSegmentCounts } from '@/modules/donors/queries/get-segment-counts'
import { DonorsPageClient } from './DonorsPageClient'

interface DonorsPageProps {
  searchParams?: Promise<{
    segment?: DonorSegment
  }>
}

// Default stats when data can't be fetched
const defaultStats: DonorStats = {
  totalDonors: 0,
  totalRaisedYTD: 0,
  atRiskCount: 0,
  newDonorsThisMonth: 0,
}

/**
 * Donors list page
 * Shows donor statistics and filterable table
 */
export default async function DonorsPage({ searchParams }: DonorsPageProps) {
  const params = await searchParams
  const segment = params?.segment || 'all'

  // Fetch stats, donors, and segment counts in parallel with error handling
  let stats: DonorStats = defaultStats
  let donors: DonorWithStats[] = []
  const segmentCounts = await getSegmentCounts().catch(() => [])

  try {
    const [statsResult, donorsResult] = await Promise.all([
      getDonorStats().catch(() => defaultStats),
      getDonors({ segment }).catch(() => ({ donors: [] as DonorWithStats[], total: 0 })),
    ])
    stats = statsResult
    donors = donorsResult.donors
  } catch {
    // Use defaults if all queries fail
  }

  return (
    <DonorsPageClient
      stats={stats}
      donors={donors}
      segmentCounts={segmentCounts}
      segment={segment}
    />
  )
}
