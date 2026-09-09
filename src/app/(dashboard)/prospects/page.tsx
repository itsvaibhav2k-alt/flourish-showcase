import Link from 'next/link'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, DollarSign, Users, Sparkles } from 'lucide-react'
import { getTopProspects, type TopProspect } from '@/modules/giving-potential/queries/get-top-prospects'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'

// Default stats when data can't be fetched
const defaultStats = {
  totalProspects: 0,
  averageScore: 0,
  totalUntappedCapacity: 0,
  highPotentialCount: 0,
}

interface ProspectsPageProps {
  searchParams?: Promise<{
    minScore?: string
    hasCapacity?: string
  }>
}

/**
 * Top Prospects page
 * Shows contacts with high giving potential scores
 */
export default async function ProspectsPage({ searchParams }: ProspectsPageProps) {
  const params = await searchParams
  const minScore = params?.minScore ? parseInt(params.minScore) : 0

  // Fetch real prospects from database
  let prospects: TopProspect[] = []
  try {
    prospects = await getTopProspects({ minScore, limit: 50 })
  } catch (error) {
    console.error('Error fetching prospects:', error)
  }

  // Calculate stats
  const stats = prospects.length > 0 ? {
    totalProspects: prospects.length,
    averageScore: Math.round(prospects.reduce((sum, p) => sum + (p.overall_score || 0), 0) / prospects.length),
    totalUntappedCapacity: prospects.reduce((sum, p) => sum + (p.estimated_net_worth || 0) - (p.lifetime_giving || 0), 0),
    highPotentialCount: prospects.filter(p => (p.overall_score || 0) >= 80).length,
  } : defaultStats

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statsCards = [
    {
      title: 'Total Prospects',
      value: stats.totalProspects.toLocaleString(),
      icon: Users,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'High-potential donors',
    },
    {
      title: 'Average Score',
      value: stats.averageScore.toString(),
      icon: Target,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      subtitle: 'Out of 100',
    },
    {
      title: 'High Potential',
      value: stats.highPotentialCount.toLocaleString(),
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Score 80+',
      highlight: stats.highPotentialCount > 0 ? 'text-green-600' : undefined,
    },
    {
      title: 'Untapped Capacity',
      value: formatCurrency(stats.totalUntappedCapacity),
      icon: DollarSign,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      subtitle: 'Estimated potential',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-semibold text-neutral-900">Top Prospects</h1>
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              Identify high-capacity donors and maximize your fundraising potential
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PageGuideTrigger pageKey="prospects" />
            <Button variant="outline" className="shadow-sm">
              <Target className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="shadow-card border-neutral-200/60 bg-white">
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

        {/* Info Card */}
        <Card className="shadow-card border-primary-200/60 bg-gradient-to-br from-primary-50 to-violet-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-1">
                  AI-Powered Giving Potential
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Our AI analyzes giving history, engagement patterns, and wealth indicators to identify
                  contacts with the highest potential for major gifts. Focus your efforts where they matter most.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prospects Table/List */}
        <Card className="shadow-card border-neutral-200/60 bg-white">
          <CardContent className="p-0">
            <Suspense fallback={
              <div className="p-8 text-center text-neutral-500">Loading prospects...</div>
            }>
              {prospects.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {prospects.map((prospect) => {
                    const score = prospect.overall_score || 0
                    return (
                      <Link
                        key={prospect.id}
                        href={`/contacts/${prospect.contact_id}`}
                        className="block p-4 hover:bg-neutral-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Contact Info */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                              {prospect.first_name[0]}{prospect.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900">
                                {prospect.first_name} {prospect.last_name}
                              </p>
                              <p className="text-sm text-neutral-500 truncate">
                                {prospect.email}
                              </p>
                            </div>
                          </div>

                          {/* Score Badge */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                                score >= 90 ? 'bg-green-100 text-green-700' :
                                score >= 80 ? 'bg-blue-100 text-blue-700' :
                                score >= 60 ? 'bg-amber-100 text-amber-700' :
                                'bg-neutral-100 text-neutral-700'
                              }`}>
                                <Target className="h-3.5 w-3.5" />
                                {score}
                              </div>
                            </div>

                            {/* Capacity */}
                            <div className="text-right min-w-[120px]">
                              <p className="text-xs text-neutral-500">Estimated Capacity</p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {prospect.estimated_net_worth ? formatCurrency(prospect.estimated_net_worth) : 'N/A'}
                              </p>
                            </div>

                            {/* Current Giving */}
                            <div className="text-right min-w-[120px]">
                              <p className="text-xs text-neutral-500">Current Giving</p>
                              <p className="text-sm font-semibold text-neutral-900">
                                {formatCurrency(prospect.lifetime_giving || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="flex gap-3 mt-3 ml-16">
                          {prospect.capacity_score && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                              Capacity: {prospect.capacity_score}
                            </span>
                          )}
                          {prospect.affinity_score && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              Affinity: {prospect.affinity_score}
                            </span>
                          )}
                          {prospect.propensity_score && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                              Propensity: {prospect.propensity_score}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-7 w-7 text-primary-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">No prospects found</p>
                  <p className="text-xs text-neutral-400 mt-1 mb-4">
                    Start adding giving potential data to your contacts to see prospects here
                  </p>
                  <Link href="/contacts">
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                      <Users className="h-4 w-4 mr-1.5" />
                      View Contacts
                    </Button>
                  </Link>
                </div>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
