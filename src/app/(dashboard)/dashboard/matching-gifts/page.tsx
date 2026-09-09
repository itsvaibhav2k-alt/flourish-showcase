export const dynamic = 'force-dynamic'

import { Building2 } from 'lucide-react'
import { MatchingGiftsDashboard } from '@/modules/matching-gifts/components/matching-gifts-dashboard'
import { getMatchingGiftStats, getMatchEligibleGifts } from '@/modules/matching-gifts/queries/get-matching-gift-stats'

export default async function MatchingGiftsPage() {
  const [stats, eligibleGifts] = await Promise.all([
    getMatchingGiftStats(),
    getMatchEligibleGifts('all'),
  ])

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Matching Gifts</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                Track and maximize employer matching gift programs
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <MatchingGiftsDashboard stats={stats} eligibleGifts={eligibleGifts} />
      </div>
    </div>
  )
}
