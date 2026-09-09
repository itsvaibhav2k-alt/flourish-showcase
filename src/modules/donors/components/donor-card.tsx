import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LapseRiskBadge } from './lapse-risk-badge'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'
import { calculateLapseRisk, type LapseRisk } from '../services/lapse-risk-calculator'
import type { DonorSegment } from '../queries/get-donors'
import { DollarSign, Calendar, Heart, TrendingUp, ExternalLink } from 'lucide-react'

interface DonorCardProps {
  donor: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    lifetime_giving: number
    last_gift_date: string | null
    gift_count: number
    avg_gift_gap_days: number | null
    segment: DonorSegment
  }
}

/**
 * Get avatar gradient based on donor segment
 */
function getAvatarBg(segment: DonorSegment, isMajor: boolean): string {
  if (isMajor) return 'bg-amber-100 text-amber-700'
  switch (segment) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'active': return 'bg-green-100 text-green-700'
    case 'lapsed': return 'bg-orange-100 text-orange-700'
    case 'major': return 'bg-amber-100 text-amber-700'
    default: return 'bg-neutral-100 text-neutral-600'
  }
}

/**
 * Donor Card - Stripe-inspired design
 * Features: gradient avatar, status dot badges, clean metadata grid, lapse risk indicator
 */
export function DonorCard({ donor }: DonorCardProps) {
  const fullName = `${donor.first_name} ${donor.last_name}`
  const initials = `${donor.first_name[0]}${donor.last_name[0]}`.toUpperCase()
  const isMajorDonor = donor.lifetime_giving >= 1000

  // Calculate lapse risk
  const lapseRisk: LapseRisk = calculateLapseRisk({
    giftCount: donor.gift_count,
    lastGiftDate: donor.last_gift_date ? new Date(donor.last_gift_date) : null,
    avgGiftGap: donor.avg_gift_gap_days,
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date relative
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'No gifts yet'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  // Segment badge config with dot indicator
  const segmentConfig: Record<DonorSegment, { bg: string; text: string; dot: string; label: string }> = {
    all: { bg: 'bg-neutral-50', text: 'text-neutral-600', dot: 'bg-neutral-400', label: 'All' },
    new: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'New' },
    active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
    lapsed: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Lapsed' },
    major: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Major' },
  }

  const segment = segmentConfig[donor.segment]

  return (
    <Link href={`/donors/${donor.id}`} className="block group">
      <Card className="hover:shadow-md transition-all duration-200 border-neutral-200/60 overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              {/* Avatar with gradient fallback */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`h-11 w-11 rounded-lg ${getAvatarBg(donor.segment, isMajorDonor)} flex items-center justify-center text-sm font-semibold shrink-0`}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">
                      {fullName}
                    </h3>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  {donor.email && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {donor.email}
                    </p>
                  )}
                  {/* Status badges with dot indicators */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {donor.segment !== 'all' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${segment.bg} ${segment.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${segment.dot}`} />
                        {segment.label}
                      </span>
                    )}
                    <LapseRiskBadge risk={lapseRisk} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section - Metadata Grid */}
          <div className="border-t border-neutral-100 bg-neutral-50/50">
            <div className="grid grid-cols-3 divide-x divide-neutral-100">
              {/* Lifetime Giving */}
              <div className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-neutral-500">Lifetime</span>
                  <ScoreInfoButton
                    scoreKey="lifetimeGiving"
                    size="sm"
                    scoreDefinitions={scoreDefinitions}
                  />
                </div>
                <p className="text-sm font-bold text-neutral-900">
                  {formatCurrency(donor.lifetime_giving)}
                </p>
              </div>

              {/* Gift Count */}
              <div className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="h-3 w-3 text-rose-500" />
                  <span className="text-xs text-neutral-500">Gifts</span>
                </div>
                <p className="text-sm font-bold text-neutral-900">
                  {donor.gift_count}
                </p>
              </div>

              {/* Last Gift */}
              <div className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-neutral-500">Last Gift</span>
                </div>
                <p className="text-xs font-medium text-neutral-700">
                  {formatRelativeDate(donor.last_gift_date)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
