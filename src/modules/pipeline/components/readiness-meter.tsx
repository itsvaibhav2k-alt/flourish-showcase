'use client'

import { cn } from '@/lib/utils'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'

interface ReadinessMeterProps {
  score: number
  label?: string
  size?: number
  strokeWidth?: number
  animated?: boolean
  className?: string
}

/**
 * Semicircular gauge showing prospect readiness score (0-100)
 * - Color coded: green (80+), yellow (50-79), red (<50)
 * - Shows "X% ready for ask" text
 * - Animated on load
 */
export function ReadinessMeter({
  score,
  label,
  size = 140,
  strokeWidth = 10,
  animated: _animated = true,
  className
}: ReadinessMeterProps) {
  const displayScore = score

  const getColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 50) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 50) return 'text-amber-700'
    return 'text-red-600'
  }

  // Semicircular gauge calculations
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius // Half circle
  const offset = circumference - (displayScore / 100) * circumference

  return (
    <div className={cn('inline-flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            stroke="#f5f5f4"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transformOrigin: 'center' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: size / 4 }}>
          <div className="flex items-center gap-1">
            <span className={cn('text-3xl font-bold', getTextColor(score))}>
              {Math.round(displayScore)}
            </span>
            <ScoreInfoButton
              scoreKey="readinessScore"
              value={Math.round(score)}
              size="sm"
              scoreDefinitions={scoreDefinitions}
            />
          </div>
          <span className="text-xs font-medium text-neutral-500 mt-0.5">
            out of 100
          </span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className={cn('text-sm font-semibold', getTextColor(score))}>
            {Math.round(displayScore)}% ready for ask
          </p>
          {label && (
            <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact linear version for cards
 */
interface CompactReadinessMeterProps {
  score: number
  showLabel?: boolean
  className?: string
}

export function CompactReadinessMeter({
  score,
  showLabel = true,
  className
}: CompactReadinessMeterProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 50) return 'text-amber-700'
    return 'text-red-600'
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600">
            Readiness
          </span>
          <span className={cn('text-xs font-semibold', getTextColor(score))}>
            {Math.round(score)}%
          </span>
        </div>
      )}
      <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-all duration-500 ease-out',
            getColor(score)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
