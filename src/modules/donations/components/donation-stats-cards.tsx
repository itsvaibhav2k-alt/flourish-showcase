'use client'

import { DollarSign, TrendingUp, Users, Clock, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DonationStats } from '../queries/get-donation-stats'

interface DonationStatsCardsProps {
  stats: DonationStats
  isLoading?: boolean
}

export function DonationStatsCards({ stats, isLoading }: DonationStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const cards = [
    {
      title: 'Total Raised',
      value: formatCurrency(stats.totalRaised),
      icon: DollarSign,
      description: 'All-time donations',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Total Donations',
      value: stats.donationCount.toString(),
      icon: Gift,
      description: 'Completed donations',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Average Gift',
      value: formatCurrency(stats.averageGift),
      icon: TrendingUp,
      description: 'Per donation',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Recurring Donors',
      value: stats.recurringDonors.toString(),
      icon: Users,
      description: 'Active subscriptions',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Month',
      value: stats.completedThisMonth.toString(),
      icon: Clock,
      description: 'Donations received',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Pending',
      value: stats.pendingCount.toString(),
      icon: Clock,
      description: 'Awaiting completion',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-neutral-200 rounded" />
              <div className="h-4 w-4 bg-neutral-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-neutral-200 rounded mb-2" />
              <div className="h-3 w-20 bg-neutral-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                {card.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900">{card.value}</div>
              <p className="text-xs text-neutral-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
