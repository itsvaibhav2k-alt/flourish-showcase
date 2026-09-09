'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DonorsTable } from '@/modules/donors/components/donors-table'
import { GivingChart } from '@/modules/donors/components/giving-chart'
import { SegmentFilterPills } from '@/modules/donors/components/segment-filter-pills'
import { type DonorSegment, type DonorWithStats } from '@/modules/donors/queries/get-donors'
import { type DonorStats } from '@/modules/donors/queries/get-donor-stats'
import { DollarSign, Heart, TrendingUp, UserPlus, AlertTriangle, LucideIcon } from 'lucide-react'
import { ExportButton } from '@/modules/reports/components/export-button'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'

interface StatsCard {
  title: string
  value: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  subtitle: string
  highlight?: string
}

interface DonorsPageClientProps {
  stats: DonorStats
  donors: DonorWithStats[]
  segmentCounts: { segment: DonorSegment; count: number }[]
  segment: DonorSegment | 'all'
}

export function DonorsPageClient({ stats, donors, segmentCounts, segment }: DonorsPageClientProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statsCards: StatsCard[] = [
    {
      title: 'Total Donors',
      value: stats.totalDonors.toLocaleString(),
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      subtitle: 'Active supporters',
    },
    {
      title: 'Raised YTD',
      value: formatCurrency(stats.totalRaisedYTD),
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Year to date',
    },
    {
      title: 'At Risk',
      value: stats.atRiskCount.toLocaleString(),
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      subtitle: 'Need attention',
      highlight: stats.atRiskCount > 0 ? 'text-amber-600' : undefined,
    },
    {
      title: 'New This Month',
      value: stats.newDonorsThisMonth.toLocaleString(),
      icon: UserPlus,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      subtitle: 'First-time donors',
      highlight: stats.newDonorsThisMonth > 0 ? 'text-teal-600' : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Donors</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage your donors and track giving history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PageGuideTrigger pageKey="donors" />
            <ExportButton exportType="donors" variant="outline" />
            <Link href="/donors/new-gift">
              <Button className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Record Gift
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="shadow-sm border-neutral-200/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className={`text-2xl font-semibold tracking-tight ${stat.highlight || 'text-neutral-900'}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Giving Trends Chart */}
        <div>
          <GivingChart />
        </div>

        {/* Segment Filter Pills */}
        <div className="bg-white border border-neutral-200/60 rounded-lg p-4 shadow-sm">
          <SegmentFilterPills
            segments={segmentCounts}
            activeSegment={segment === 'all' ? null : segment}
          />
        </div>

        {/* Donors Table */}
        <div>
          <Card className="shadow-sm border-neutral-200/60 bg-white">
            <CardContent className="p-0">
              <Suspense fallback={
                <div className="p-8 text-center text-neutral-500">Loading donors...</div>
              }>
                {donors.length > 0 ? (
                  <DonorsTable donors={donors} />
                ) : (
                  <div className="py-16 text-center">
                    <div className="h-16 w-16 rounded-lg bg-rose-50 flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-7 w-7 text-rose-300" />
                    </div>
                    <p className="text-sm font-medium text-neutral-600">No donors found</p>
                    <p className="text-xs text-neutral-400 mt-1 mb-4">
                      {segment === 'all'
                        ? 'Record a gift to add your first donor'
                        : 'No donors match this filter'}
                    </p>
                    <Link href="/donors/new-gift">
                      <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm">
                        <DollarSign className="h-4 w-4 mr-1.5" />
                        Record First Gift
                      </Button>
                    </Link>
                  </div>
                )}
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
