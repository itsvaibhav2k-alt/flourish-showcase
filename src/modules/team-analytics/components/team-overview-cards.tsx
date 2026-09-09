'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Mail, DollarSign } from 'lucide-react'
import type { TeamOverviewStatsNew } from '../queries'

interface TeamOverviewCardsProps {
  stats: TeamOverviewStatsNew
  dateRange: '7d' | '30d' | '90d' | 'all'
}

export function TeamOverviewCards({ stats, dateRange }: TeamOverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7d':
        return 'Last 7 days'
      case '30d':
        return 'Last 30 days'
      case '90d':
        return 'Last 90 days'
      case 'all':
        return 'All time'
      default:
        return 'Last 30 days'
    }
  }

  const cards = [
    {
      title: 'Team Members',
      value: stats.total_team_members.toString(),
      icon: Users,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Total Activities',
      value: stats.total_activities.toLocaleString(),
      icon: Activity,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      subtitle: getDateRangeLabel(),
    },
    {
      title: 'Emails Sent',
      value: stats.total_emails_sent.toLocaleString(),
      icon: Mail,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      subtitle: getDateRangeLabel(),
    },
    {
      title: 'Gifts Recorded',
      value: stats.total_gifts_recorded.toLocaleString(),
      icon: DollarSign,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      subtitle: dateRange !== 'all' ? formatCurrency(stats.total_gift_amount) : undefined,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-card border-neutral-200/60 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {card.title}
            </CardTitle>
            <div className={`${card.bgColor} p-2 rounded-lg`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-neutral-900">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-neutral-500 mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
