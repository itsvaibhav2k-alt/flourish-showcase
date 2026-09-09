'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, TrendingUp, UserPlus, Star } from 'lucide-react'
import { getDonorCounts, type DonorCounts } from '../queries/get-donor-counts'

/**
 * Donor metrics cards showing donor counts by segment
 */
export function DonorMetrics() {
  const [counts, setCounts] = useState<DonorCounts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true)
        const data = await getDonorCounts()
        setCounts(data)
      } catch (error) {
        console.error('Error fetching donor counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!counts) {
    return null
  }

  const metrics = [
    {
      title: 'Total Donors',
      value: counts.total.toLocaleString(),
      icon: Heart,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'All time',
    },
    {
      title: 'Active Donors',
      value: counts.active.toLocaleString(),
      icon: TrendingUp,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: `${counts.lapsed} lapsed`,
      subtitleColor: 'text-amber-600',
    },
    {
      title: 'New Donors',
      value: counts.new.toLocaleString(),
      icon: UserPlus,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'Last 90 days',
    },
    {
      title: 'Major Donors',
      value: counts.major.toLocaleString(),
      icon: Star,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: '$1,000+ lifetime',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title} className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                    {metric.value}
                  </p>
                  <p className={`text-xs ${metric.subtitleColor || 'text-neutral-400'}`}>
                    {metric.subtitle}
                  </p>
                </div>
                <div
                  className={`h-10 w-10 rounded-lg ${metric.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
