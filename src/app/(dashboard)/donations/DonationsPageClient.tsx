'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecentDonationsList } from '@/modules/donations/components/recent-donations-list'
import type { GetDonationsResult, DonationStats } from '@/modules/donations/queries/get-donations'
import { CreditCard, DollarSign, TrendingUp, RefreshCw, FileText, Users } from 'lucide-react'

interface DonationsPageClientProps {
  stats: DonationStats
  donationsResult: GetDonationsResult
}

export function DonationsPageClient({ stats, donationsResult }: DonationsPageClientProps) {
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
      title: 'Total Raised',
      value: formatCurrency(stats.total_amount),
      icon: DollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'All-time donations',
    },
    {
      title: 'Total Donations',
      value: stats.completed_donations.toLocaleString(),
      icon: CreditCard,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'Completed payments',
    },
    {
      title: 'Average Gift',
      value: formatCurrency(stats.average_donation),
      icon: TrendingUp,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      subtitle: 'Per donation',
    },
    {
      title: 'Recurring Donors',
      value: stats.monthly_recurring.toLocaleString(),
      icon: RefreshCw,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      subtitle: 'Monthly supporters',
      highlight: stats.monthly_recurring > 0 ? 'text-violet-600' : undefined,
    },
  ]
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Donations</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage donation forms and track online contributions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/donations/forms">
              <Button variant="outline" className="shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Manage Forms
              </Button>
            </Link>
            <Link href="/donations/forms/new">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </Link>
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

        {/* Quick Links */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Link href="/donations/forms">
            <Card className="shadow-card border-neutral-200/60 bg-white hover:shadow-md hover:border-neutral-300/60 transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">View Donation Forms</p>
                    <p className="text-sm text-neutral-500">Create and manage public forms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/donors/new-gift">
            <Card className="shadow-card border-neutral-200/60 bg-white hover:shadow-md hover:border-neutral-300/60 transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-rose-50 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Record Gift</p>
                    <p className="text-sm text-neutral-500">Manually log a donation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/donors">
            <Card className="shadow-card border-neutral-200/60 bg-white hover:shadow-md hover:border-neutral-300/60 transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">View Donors</p>
                    <p className="text-sm text-neutral-500">See all donor profiles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Donations Table */}
        <div>
          <Card className="shadow-card border-neutral-200/60 bg-white">
            <div className="p-5 border-b border-neutral-200/60">
              <h2 className="text-lg font-semibold text-neutral-900">Recent Donations</h2>
              <p className="text-sm text-neutral-500 mt-1">Latest online contributions</p>
            </div>
            <CardContent className="p-0">
              {donationsResult.donations.length > 0 ? (
                <RecentDonationsList donations={donationsResult.donations} />
              ) : (
                <div className="py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-7 w-7 text-primary-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">No donations yet</p>
                  <p className="text-xs text-neutral-400 mt-1 mb-4">
                    Create a donation form to start accepting online contributions
                  </p>
                  <Link href="/donations/forms/new">
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Create First Form
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
