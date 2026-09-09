'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Pause,
  CheckCircle2,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RecurringGift, RecurringGiftStats } from '../queries/get-recurring-gifts'

interface RecurringGiftsDashboardProps {
  stats: RecurringGiftStats
  gifts: RecurringGift[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusBadge(status: RecurringGift['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    case 'paused':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
          Cancelled
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
  }
}

export function RecurringGiftsDashboard({ stats, gifts }: RecurringGiftsDashboardProps) {
  const statCards = [
    {
      title: 'Active Subscriptions',
      value: stats.activeRecurring.toString(),
      subtitle: `${stats.totalDonors} unique donors`,
      icon: RefreshCw,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      subtitle: 'recurring gifts',
      icon: DollarSign,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Projected Yearly',
      value: formatCurrency(stats.yearlyRevenue),
      subtitle: 'if retained',
      icon: TrendingUp,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Average Gift',
      value: formatCurrency(stats.averageGift),
      subtitle: 'per month',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Alert for failed payments */}
      {stats.failedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">
              {stats.failedCount} payment{stats.failedCount > 1 ? 's' : ''} failed
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              These recurring gifts have payment issues that need attention.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-red-200 text-red-700 hover:bg-red-100">
            View Failed
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recurring Gifts List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary-600" />
                Recurring Donors
              </CardTitle>
              <CardDescription>
                All active and paused recurring gift subscriptions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {gifts.length === 0 ? (
            <div className="py-12 text-center">
              <RefreshCw className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-neutral-600">No recurring gifts yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Recurring gifts will appear here once donors set up subscriptions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/contacts/${gift.contactId}`}
                          className="font-medium text-neutral-900 hover:underline truncate"
                        >
                          {gift.contactName}
                        </Link>
                        {getStatusBadge(gift.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-500 mt-0.5">
                        <span className="font-medium text-green-600">
                          {formatCurrency(gift.amount)}/month
                        </span>
                        <span>•</span>
                        <span>Started {formatDate(gift.startDate)}</span>
                        {gift.totalContributed > gift.amount && (
                          <>
                            <span>•</span>
                            <span>{formatCurrency(gift.totalContributed)} total</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {gift.nextChargeDate && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Calendar className="h-3 w-3" />
                          Next charge
                        </div>
                        <p className="text-sm font-medium text-neutral-700">
                          {formatDate(gift.nextChargeDate)}
                        </p>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      asChild
                    >
                      <Link href={`/contacts/${gift.contactId}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">
                Grow Recurring Revenue
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Recurring donors have a 90% retention rate compared to 45% for one-time donors.
                Encourage donors to set up monthly giving to build predictable, sustainable revenue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
