'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  DollarSign,
  ChevronRight,
  Clock,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import type { RetentionStats, LybuntContact } from '../queries/get-retention-stats'

interface RetentionDashboardProps {
  stats: RetentionStats
  lybuntContacts: LybuntContact[]
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

export function RetentionDashboard({ stats, lybuntContacts }: RetentionDashboardProps) {
  const currentYear = new Date().getFullYear()

  const statCards = [
    {
      title: 'Retention Rate',
      value: `${stats.retentionRate}%`,
      subtitle: `${stats.retainedDonors} of ${stats.lastYearDonors} retained`,
      icon: RefreshCw,
      iconBg: stats.retentionRate >= 50 ? 'bg-green-50' : 'bg-amber-50',
      iconColor: stats.retentionRate >= 50 ? 'text-green-600' : 'text-amber-600',
      trend: stats.retentionRate >= 50 ? 'positive' : 'negative',
    },
    {
      title: 'LYBUNT Donors',
      value: stats.lybuntCount.toString(),
      subtitle: `${formatCurrency(stats.lybuntValue)} at risk`,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: 'negative',
    },
    {
      title: 'SYBUNT Donors',
      value: stats.sybuntCount.toString(),
      subtitle: `${formatCurrency(stats.sybuntValue)} lapsed avg`,
      icon: TrendingDown,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: 'negative',
    },
    {
      title: 'New Donors',
      value: stats.newDonorsThisYear.toString(),
      subtitle: `acquired in ${currentYear}`,
      icon: UserPlus,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: 'positive',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Alert for at-risk donors */}
      {stats.lybuntCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              {stats.lybuntCount} donor{stats.lybuntCount > 1 ? 's' : ''} at risk of lapsing
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              These donors gave last year but haven&apos;t given yet in {currentYear}.
              Reach out to re-engage them.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-amber-200 text-amber-700 hover:bg-amber-100">
            <Mail className="h-4 w-4 mr-1.5" />
            Send Campaign
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

      {/* Donor Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donor Flow Visualization */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Donor Flow - {currentYear}</CardTitle>
            <CardDescription>How donors moved this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-600">Retained</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{stats.retainedDonors}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-neutral-600">New</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{stats.newDonorsThisYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-neutral-600">LYBUNT</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{stats.lybuntCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-neutral-600">SYBUNT</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{stats.sybuntCount}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Total {currentYear} Donors</span>
                <span className="font-semibold text-neutral-900">{stats.currentYearDonors}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-neutral-500">Total {currentYear - 1} Donors</span>
                <span className="font-semibold text-neutral-900">{stats.lastYearDonors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LYBUNT List */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  LYBUNT Donors
                </CardTitle>
                <CardDescription>
                  Last Year But Unfortunately Not This (yet)
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {lybuntContacts.length} contacts
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lybuntContacts.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="h-12 w-12 text-green-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-neutral-600">Great news!</p>
                <p className="text-xs text-neutral-400 mt-1">
                  All donors from last year have given again this year
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lybuntContacts.slice(0, 10).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-neutral-900 hover:underline truncate block"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>{formatCurrency(contact.lifetimeGiving)} lifetime</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {contact.daysSinceLastGift} days ago
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-600">
                          {formatCurrency(contact.lastGiftAmount)}
                        </p>
                        <p className="text-xs text-neutral-400">last gift</p>
                      </div>

                      {contact.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          title="Send re-engagement email"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        asChild
                      >
                        <Link href={`/contacts/${contact.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {lybuntContacts.length > 10 && (
                  <p className="text-center text-sm text-neutral-500 pt-2">
                    +{lybuntContacts.length - 10} more LYBUNT donors
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-violet-50 to-primary-50 border-primary-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">
                Understanding LYBUNT & SYBUNT
              </h3>
              <div className="text-sm text-primary-700 mt-2 space-y-2">
                <p>
                  <strong>LYBUNT</strong> (Last Year But Unfortunately Not This) - Donors who gave
                  in {currentYear - 1} but haven&apos;t yet given in {currentYear}. These are your
                  highest priority for re-engagement.
                </p>
                <p>
                  <strong>SYBUNT</strong> (Some Year But Unfortunately Not This) - Donors who gave
                  in the past but have lapsed for more than a year. These require more effort to
                  reactivate.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
