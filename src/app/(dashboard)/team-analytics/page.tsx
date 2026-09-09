'use client'

import { useState, useEffect } from 'react'
import { Users, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TeamOverviewCards,
  ActivityLeaderboard,
  MemberStatsGrid,
  ActivityChart,
  DateRangeSelector,
} from '@/modules/team-analytics/components'
import {
  getTeamStats,
  type TeamOverviewStatsNew,
  type TeamMemberStatsNew,
  type DateRangeType,
} from '@/modules/team-analytics/queries'
import { Card, CardContent } from '@/components/ui/card'

export default function TeamAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeType>('30d')
  const [overview, setOverview] = useState<TeamOverviewStatsNew | null>(null)
  const [members, setMembers] = useState<TeamMemberStatsNew[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'leaderboard' | 'grid'>('leaderboard')

  // Fetch team stats when date range changes
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const data = await getTeamStats(dateRange)
        setOverview(data.overview)
        setMembers(data.members)
      } catch (error) {
        console.error('Error fetching team stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [dateRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-500">Loading team analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-violet-600" />
                Team Analytics
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                Track team member activity and performance
              </p>
            </div>
            <DateRangeSelector selected={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Info Banner */}
        <div>
          <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="h-5 w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-900">
                <p className="font-medium">Team activity tracking</p>
                <p className="text-neutral-600 mt-1">
                  Analytics are based on recorded activities including contacts added, gifts
                  recorded, emails sent, and notes created. The materialized view is refreshed
                  periodically to ensure up-to-date metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Cards */}
        <div>
          {overview && <TeamOverviewCards stats={overview} dateRange={dateRange} />}
        </div>

        {/* Activity Chart */}
        <div>
          <ActivityChart members={members} dateRange={dateRange} />
        </div>

        {/* View Toggle */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Team Members</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('leaderboard')}
              >
                Ranked
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid View
              </Button>
            </div>
          </div>
        </div>

        {/* Team Members View */}
        <div>
          {viewMode === 'leaderboard' ? (
            <ActivityLeaderboard members={members} dateRange={dateRange} />
          ) : (
            <MemberStatsGrid members={members} />
          )}
        </div>


      </div>
    </div>
  )
}
