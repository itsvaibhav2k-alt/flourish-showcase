'use client'

import { formatDistanceToNow } from 'date-fns'
import { DollarSign, User, CalendarDays, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Donation } from '../queries/get-donations'

interface RecentDonationsListProps {
  donations: Donation[]
  isLoading?: boolean
  limit?: number
}

export function RecentDonationsList({
  donations,
  isLoading,
  limit = 10,
}: RecentDonationsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'A'
  }

  const getDonorName = (donation: Donation) => {
    if (donation.contact) {
      return `${donation.contact.firstName || ''} ${donation.contact.lastName || ''}`.trim()
    }
    if (donation.donorName) {
      return donation.donorName
    }
    return 'Anonymous Donor'
  }

  const displayDonations = donations.slice(0, limit)

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Latest donation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-neutral-200 rounded" />
                  <div className="h-3 w-24 bg-neutral-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (donations.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Latest donation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
              <DollarSign className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">No donations yet</h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              When donors contribute, their donations will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
        <CardDescription>
          {donations.length === 1 ? '1 donation' : `${donations.length} donations`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayDonations.map((donation) => {
            const donorName = getDonorName(donation)
            const initials = getInitials(
              donation.contact?.firstName,
              donation.contact?.lastName,
              donation.donorEmail
            )

            return (
              <div
                key={donation.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary-100 text-primary-700 font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Donation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {donorName}
                      </p>
                      {donation.donorEmail && (
                        <p className="text-xs text-neutral-500 truncate">
                          {donation.donorEmail}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(donation.amount)}
                      </p>
                      {donation.isRecurring && (
                        <Badge
                          variant="outline"
                          className="mt-1 bg-primary-50 text-primary-700 border-primary-200 text-xs"
                        >
                          <RefreshCw className="h-2.5 w-2.5 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <CalendarDays className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(donation.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {donation.donationForm && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <span className="text-neutral-400">"</span>
                        <span>{donation.donationForm.name}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    {donation.status !== 'completed' && (
                      <>
                        <span className="text-neutral-400 text-xs">"</span>
                        <Badge
                          variant="outline"
                          className={
                            donation.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 text-xs'
                              : donation.status === 'failed'
                              ? 'bg-red-50 text-red-700 border-red-200 text-xs'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300 text-xs'
                          }
                        >
                          {donation.status}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Show More Link */}
        {donations.length > limit && (
          <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
            <a
              href="/donations"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all {donations.length} donations
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
