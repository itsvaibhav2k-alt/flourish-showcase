export const dynamic = 'force-dynamic'

import { Users } from 'lucide-react'
import { RetentionDashboard } from '@/modules/reports/components/retention-dashboard'
import { getRetentionStats, getLybuntContacts } from '@/modules/reports/queries/get-retention-stats'

export default async function RetentionPage() {
  const [stats, lybuntContacts] = await Promise.all([
    getRetentionStats(),
    getLybuntContacts(),
  ])

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Donor Retention</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                Track donor retention and identify lapsed donors
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <RetentionDashboard stats={stats} lybuntContacts={lybuntContacts} />
      </div>
    </div>
  )
}
