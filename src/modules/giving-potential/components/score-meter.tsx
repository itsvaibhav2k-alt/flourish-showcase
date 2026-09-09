'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface ScoreMeterProps {
  score: number
  label?: string
  showNumber?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

/**
 * Reusable meter component for displaying scores
 * - Color coded: green (80+), yellow (50-79), red (<50)
 * - Shows score number in center
 * - Animated on load
 */
export function ScoreMeter({
  score,
  label,
  showNumber = true,
  size = 'md',
  animated: _animated = true,
  className
}: ScoreMeterProps) {
  const displayScore = score

  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-neutral-400'
  }

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 50) return 'text-amber-700'
    return 'text-neutral-600'
  }

  const sizeClasses = {
    sm: {
      container: 'space-y-1.5',
      text: 'text-xs',
      number: 'text-sm',
      height: 'h-1.5'
    },
    md: {
      container: 'space-y-2',
      text: 'text-sm',
      number: 'text-base',
      height: 'h-2'
    },
    lg: {
      container: 'space-y-3',
      text: 'text-base',
      number: 'text-lg',
      height: 'h-3'
    }
  }

  const styles = sizeClasses[size]

  return (
    <div className={cn(styles.container, className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className={cn('font-medium text-neutral-700', styles.text)}>
            {label}
          </span>
          {showNumber && (
            <span className={cn('font-semibold', styles.number, getTextColor(score))}>
              {Math.round(displayScore)}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <Progress
          value={displayScore}
          max={100}
          className={cn('bg-neutral-100', styles.height)}
        />
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-all duration-500 ease-out',
            getColor(score),
            styles.height
          )}
          style={{
            width: `${displayScore}%`,
          }}
        />
      </div>
    </div>
  )
}

interface CircularScoreMeterProps {
  score: number
  label?: string
  size?: number
  strokeWidth?: number
  animated?: boolean
  className?: string
}

/**
 * Circular meter variant for dashboard displays
 */
export function CircularScoreMeter({
  score,
  label,
  size = 120,
  strokeWidth = 8,
  animated = true,
  className
}: CircularScoreMeterProps) {
  const displayScore = score

  const getColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 50) return '#f59e0b' // amber-500
    return '#a8a29e' // neutral-400
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f5f5f4"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-neutral-900">
            {Math.round(displayScore)}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-neutral-600 text-center">
          {label}
        </span>
      )}
    </div>
  )
}
