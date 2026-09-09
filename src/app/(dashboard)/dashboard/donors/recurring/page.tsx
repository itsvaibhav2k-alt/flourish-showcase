export const dynamic = 'force-dynamic'

import { RefreshCw } from 'lucide-react'
import { RecurringGiftsDashboard } from '@/modules/donors/components/recurring-gifts-dashboard'
import { getRecurringGiftStats, getRecurringGifts } from '@/modules/donors/queries/get-recurring-gifts'

export default async function RecurringGiftsPage() {
  const [stats, gifts] = await Promise.all([
    getRecurringGiftStats(),
    getRecurringGifts(),
  ])

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Recurring Gifts</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                Manage monthly giving and subscription donations
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <RecurringGiftsDashboard stats={stats} gifts={gifts} />
      </div>
    </div>
  )
}
