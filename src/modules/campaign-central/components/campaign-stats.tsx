'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Target, TrendingUp, Users, DollarSign } from 'lucide-react'

interface CampaignStatsProps {
  stats: {
    total: number
    active: number
    totalGoal: number
    totalRaised: number
    totalDonors: number
  }
}

export function CampaignStats({ stats }: CampaignStatsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  const progressPercent =
    stats.totalGoal > 0 ? Math.min(100, (stats.totalRaised / stats.totalGoal) * 100) : 0

  const statItems = [
    {
      label: 'Active Campaigns',
      value: stats.active,
      subLabel: `${stats.total} total`,
      icon: Target,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Raised',
      value: formatCurrency(stats.totalRaised),
      subLabel: `${progressPercent.toFixed(0)}% of goal`,
      icon: DollarSign,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Campaign Goal',
      value: formatCurrency(stats.totalGoal),
      subLabel: 'across active',
      icon: TrendingUp,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      label: 'Total Donors',
      value: stats.totalDonors,
      subLabel: 'participating',
      icon: Users,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="shadow-card border-neutral-200/60 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                    {item.value}
                  </p>
                  <p className="text-xs text-neutral-400">{item.subLabel}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
