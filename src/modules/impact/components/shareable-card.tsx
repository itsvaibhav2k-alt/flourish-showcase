'use client'

import { forwardRef } from 'react'
import { Sparkles, Heart } from 'lucide-react'

interface ImpactMetric {
  type: string
  value: number
  label: string
  icon?: string
}

interface ShareableCardProps {
  donorName: string
  headline: string
  keyMetrics: ImpactMetric[]
  organizationName: string
  organizationLogo?: string
  callToAction?: string
}

/**
 * Social-media-ready card design optimized for sharing
 * Fixed aspect ratio (1200x630) for Open Graph images
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  (
    {
      donorName,
      headline,
      keyMetrics,
      organizationName,
      organizationLogo,
      callToAction = 'Join us in making a difference',
    },
    ref
  ) => {
    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`
      }
      return num.toString()
    }

    return (
      <div
        ref={ref}
        className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600"
        style={{
          width: '1200px',
          height: '630px',
          aspectRatio: '1200/630',
        }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-400/20 rounded-full -ml-40 -mb-40 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-16 text-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {organizationLogo ? (
                <img
                  src={organizationLogo}
                  alt={organizationName}
                  className="h-16 w-16 rounded-lg bg-white/90 p-2"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-white/90 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary-600 fill-primary-600" />
                </div>
              )}
              <div>
                <div className="text-2xl font-bold">{organizationName}</div>
                <div className="text-lg text-primary-100">Impact Story</div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-semibold">{donorName}</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-4xl">
              <h1 className="text-6xl font-bold leading-tight mb-6 heading-display">
                {headline}
              </h1>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {keyMetrics.slice(0, 3).map((metric, index) => (
                <div
                  key={index}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                >
                  <div className="text-5xl font-bold mb-2">
                    {formatNumber(metric.value)}
                  </div>
                  <div className="text-xl text-primary-100">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <p className="text-2xl text-primary-100 font-medium">
                {callToAction}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ShareableCard.displayName = 'ShareableCard'
