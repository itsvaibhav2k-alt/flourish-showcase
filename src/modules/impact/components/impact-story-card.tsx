'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Share2,
  Download,
  Copy,
  Check,
  Heart,
  Users,
  Utensils,
  Home,
  Book,
  Sparkles
} from 'lucide-react'
import { ImpactBreakdown } from './impact-breakdown'

interface ImpactMetric {
  type: string
  value: number
  label: string
  icon?: string
}

interface ImpactStoryCardProps {
  donorName: string
  headline: string
  narrative: string
  metrics: ImpactMetric[]
  totalDonation: number
  organizationName?: string
  onShare?: (platform: 'twitter' | 'facebook' | 'copy') => void
  onDownload?: () => void
}

const iconMap: Record<string, typeof Heart> = {
  heart: Heart,
  users: Users,
  meals: Utensils,
  families: Home,
  books: Book,
  sparkles: Sparkles,
}

/**
 * Beautiful card displaying a donor's personalized impact story
 * Shows headline, narrative, and impact breakdown with share/download options
 */
export function ImpactStoryCard({
  donorName,
  headline,
  narrative,
  metrics,
  totalDonation,
  organizationName = 'Our Organization',
  onShare,
  onDownload,
}: ImpactStoryCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    if (onShare) {
      onShare('copy')
    }
    // Copy current URL to clipboard
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitterShare = () => {
    if (onShare) {
      onShare('twitter')
    }
    const text = `${headline} - Thank you for making a difference with ${organizationName}!`
    const url = window.location.href
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    )
  }

  const handleFacebookShare = () => {
    if (onShare) {
      onShare('facebook')
    }
    const url = window.location.href
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="overflow-hidden max-w-3xl mx-auto">
      {/* Gradient Header */}
      <div className="relative bg-primary-600 px-8 py-12 text-white">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium text-primary-100">Your Impact Story</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4 heading-display">
            {headline}
          </h1>
          <p className="text-lg text-primary-50 leading-relaxed max-w-2xl">
            {narrative}
          </p>
        </div>
      </div>

      <CardContent className="p-8">
        {/* Impact Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Here's what your {formatCurrency(totalDonation)} donation made possible:
          </h3>
          <ImpactBreakdown metrics={metrics} />
        </div>

        {/* Thank You Message */}
        <div className="bg-neutral-50 rounded-xl p-6 border border-amber-100">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            </div>
            <div>
              <p className="text-neutral-700 leading-relaxed">
                <span className="font-semibold">{donorName}</span>, your generosity is changing lives.
                Every contribution brings hope and creates lasting change in our community.
                Thank you for being a vital part of this mission.
              </p>
              <p className="text-sm text-neutral-600 mt-3">
                With gratitude,<br />
                <span className="font-medium">{organizationName}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Share Footer */}
      <CardFooter className="bg-neutral-50 px-8 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-neutral-200">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Share2 className="w-4 h-4" />
          <span>Share your impact</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTwitterShare}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFacebookShare}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
