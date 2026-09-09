import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Kanban,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Plus,
  Calendar,
  UserCircle,
} from 'lucide-react'
import {
  getProspectsByStage,
  getPipelineStats,
  type PipelineProspect,
} from '@/modules/pipeline'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import { PipelineKanban } from '@/modules/pipeline/components/pipeline-kanban'
import { PipelineFilters } from '@/modules/pipeline/components/pipeline-filters'

/**
 * Pipeline page - Major Gift Kanban Board
 * Shows prospects organized by stage in a Kanban view
 */
export default async function PipelinePage() {
  // Fetch pipeline data
  let prospectsByStage: Record<string, PipelineProspect[]> = {
    identification: [],
    qualification: [],
    cultivation: [],
    solicitation: [],
    stewardship: [],
  }

  let stats = {
    totalProspects: 0,
    byStage: {
      identification: 0,
      qualification: 0,
      cultivation: 0,
      solicitation: 0,
      stewardship: 0,
    },
    totalTargetAmount: 0,
    averageReadiness: 0,
  }

  try {
    ;[prospectsByStage, stats] = await Promise.all([
      getProspectsByStage(),
      getPipelineStats(),
    ])
  } catch (error) {
    console.error('Error fetching pipeline data:', error)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Prospects',
      value: stats.totalProspects.toLocaleString(),
      icon: Users,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'In pipeline',
    },
    {
      title: 'Target Amount',
      value: formatCurrency(stats.totalTargetAmount),
      icon: DollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Total ask amount',
    },
    {
      title: 'Average Readiness',
      value: stats.averageReadiness.toString(),
      icon: Target,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      subtitle: 'Out of 100',
    },
    {
      title: 'In Cultivation',
      value: stats.byStage.cultivation.toString(),
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      subtitle: 'Active prospects',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Kanban className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-semibold text-neutral-900">
                Major Gift Pipeline
              </h1>
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              Track and manage major gift prospects through the cultivation cycle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PageGuideTrigger pageKey="pipeline" />
            <Button asChild variant="outline" className="shadow-sm">
              <Link href="/prospects">
                <Target className="h-4 w-4 mr-2" />
                View Prospects
              </Link>
            </Button>
            <Button asChild className="bg-primary-600 hover:bg-primary-700 shadow-sm">
              <Link href="/contacts">
                <Plus className="h-4 w-4 mr-2" />
                Add Prospect
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="shadow-sm border-neutral-200/60 bg-white"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <PipelineFilters />

        {/* Kanban Board with Drag & Drop */}
        <PipelineKanban prospectsByStage={prospectsByStage} />
      </div>
    </div>
  )
}
