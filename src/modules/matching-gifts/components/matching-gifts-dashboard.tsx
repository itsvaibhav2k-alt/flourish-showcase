'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MatchingGiftSummary, MatchEligibleGift, MatchingGiftStatus } from '../schemas/matching-gift.schema'
import { updateMatchingGiftStatus } from '../actions/update-matching-gift'

interface MatchingGiftsDashboardProps {
  stats: MatchingGiftSummary
  eligibleGifts: MatchEligibleGift[]
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

function getStatusBadge(status: MatchingGiftStatus) {
  switch (status) {
    case 'eligible':
    case 'unknown':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case 'submitted':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      )
    case 'received':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Received
        </Badge>
      )
    case 'ineligible':
      return (
        <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Ineligible
        </Badge>
      )
  }
}

export function MatchingGiftsDashboard({ stats, eligibleGifts }: MatchingGiftsDashboardProps) {
  const router = useRouter()
  const [filter, setFilter] = React.useState<'all' | 'eligible' | 'submitted' | 'received'>('eligible')
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const filteredGifts = React.useMemo(() => {
    if (filter === 'all') return eligibleGifts
    if (filter === 'eligible') {
      return eligibleGifts.filter(g => g.status === 'eligible' || g.status === 'unknown')
    }
    return eligibleGifts.filter(g => g.status === filter)
  }, [eligibleGifts, filter])

  const handleStatusUpdate = async (giftId: string, newStatus: MatchingGiftStatus) => {
    setUpdatingId(giftId)
    try {
      const result = await updateMatchingGiftStatus(giftId, newStatus)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to update status')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const statCards = [
    {
      title: 'Potential Matches',
      value: formatCurrency(stats.totalPotential),
      subtitle: `${stats.potentialDonors} donors`,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Submitted',
      value: formatCurrency(stats.totalSubmitted),
      subtitle: `${stats.submittedDonors} donors`,
      icon: TrendingUp,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Received',
      value: formatCurrency(stats.totalReceived),
      subtitle: `${stats.receivedDonors} donors`,
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Capture Rate',
      value: `${stats.captureRate}%`,
      subtitle: 'of eligible matches',
      icon: DollarSign,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
  ]

  return (
    <div className="space-y-6">
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

      {/* Eligible Gifts Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                Match-Eligible Donations
              </CardTitle>
              <CardDescription>
                Track and manage matching gift submissions
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="eligible">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGifts.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-neutral-600">No matching gifts found</p>
              <p className="text-xs text-neutral-400 mt-1">
                {filter === 'all'
                  ? 'No donors have provided employer information yet'
                  : `No gifts with "${filter}" status`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary-600" />
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
                        <span>{formatCurrency(gift.amount)} gift</span>
                        <span>•</span>
                        <span>{gift.employerName}</span>
                        {gift.matchRatio && gift.matchRatio > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{gift.matchRatio}:1 match</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {gift.potentialMatch && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          +{formatCurrency(gift.potentialMatch)}
                        </p>
                        <p className="text-xs text-neutral-400">potential</p>
                      </div>
                    )}

                    {/* Status Update Dropdown */}
                    {gift.status !== 'received' && gift.status !== 'ineligible' && (
                      <Select
                        value={gift.status}
                        onValueChange={(v) => handleStatusUpdate(gift.id, v as MatchingGiftStatus)}
                        disabled={updatingId === gift.id}
                      >
                        <SelectTrigger className="w-[130px] h-9">
                          {updatingId === gift.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eligible">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="ineligible">Ineligible</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Send Reminder Button */}
                    {(gift.status === 'eligible' || gift.status === 'unknown') && gift.contactEmail && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        title="Send matching gift reminder"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
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
      <Card className="bg-gradient-to-r from-primary-50 to-violet-50 border-primary-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">
                Maximize Your Matching Gift Revenue
              </h3>
              <p className="text-sm text-primary-700 mt-1">
                $4-7 billion in matching gifts goes unclaimed annually. Encourage donors to check
                if their employer offers a matching gift program, and follow up on pending matches
                to increase your capture rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
