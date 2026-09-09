'use client'

import { cn } from '@/lib/utils'
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'

// Sparkline component for mini-charts
interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  fillColor?: string
  className?: string
}

function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeColor = '#16804d',
  fillColor = 'rgba(22, 128, 77, 0.1)',
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return ''

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return { x, y }
    })

    // Create smooth curve using quadratic bezier
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const midX = (prev.x + curr.x) / 2
      d += ` Q ${prev.x} ${curr.y} ${midX} ${(prev.y + curr.y) / 2}`
      if (i === points.length - 1) {
        d += ` T ${curr.x} ${curr.y}`
      }
    }

    return d
  }, [data, width, height])

  const areaPath = useMemo(() => {
    if (!path) return ''
    return `${path} L ${width - 2} ${height} L 2 ${height} Z`
  }, [path, width, height])

  if (!data || data.length < 2) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill="url(#sparkline-gradient)"
        className="transition-all duration-500"
      />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
      {/* End dot */}
      <circle
        cx={width - 2}
        cy={
          data.length > 0
            ? height -
              2 -
              ((data[data.length - 1] - Math.min(...data)) /
                (Math.max(...data) - Math.min(...data) || 1)) *
                (height - 4)
            : height / 2
        }
        r="2.5"
        fill={strokeColor}
        className="transition-all duration-500"
      />
    </svg>
  )
}

// Progress bar component for quota/limit display
interface ProgressBarProps {
  value: number
  max: number
  color?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function ProgressBar({
  value,
  max,
  color = 'primary',
  showLabel = true,
  size = 'sm',
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  }

  const bgClasses = {
    primary: 'bg-primary-100',
    success: 'bg-green-100',
    warning: 'bg-amber-100',
    error: 'bg-rose-100',
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2',
          bgClasses[color]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-medium text-neutral-500 tabular-nums">
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-neutral-600 tabular-nums">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Change indicator component with improved styling
interface ChangeIndicatorProps {
  change: string
  direction?: 'up' | 'down' | 'neutral' | null
  comparisonLabel?: string
  size?: 'sm' | 'md'
}

function ChangeIndicator({
  change,
  direction,
  comparisonLabel,
  size = 'sm',
}: ChangeIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  const getIcon = () => {
    if (direction === 'up') return <ArrowUpRight className={iconSize} />
    if (direction === 'down') return <ArrowDownRight className={iconSize} />
    return <Minus className={iconSize} />
  }

  const getStyles = () => {
    if (direction === 'up') {
      return {
        container: 'bg-green-50 text-green-700 ring-1 ring-green-100',
        hover: 'group-hover:bg-green-100 group-hover:ring-green-200',
      }
    }
    if (direction === 'down') {
      return {
        container: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
        hover: 'group-hover:bg-rose-100 group-hover:ring-rose-200',
      }
    }
    return {
      container: 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-100',
      hover: 'group-hover:bg-neutral-100 group-hover:ring-neutral-200',
    }
  }

  const styles = getStyles()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md',
          'text-xs font-semibold tabular-nums',
          'transition-all duration-200',
          styles.container,
          styles.hover
        )}
      >
        {getIcon()}
        <span>{change}</span>
      </div>
      {comparisonLabel && (
        <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
          {comparisonLabel}
        </span>
      )}
    </div>
  )
}

// Main StatCard props - extended for new features while maintaining backwards compatibility
interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconBg: string
  iconColor: string
  change?: string | null
  changeLabel?: string
  changeDirection?: 'up' | 'down' | 'neutral' | null
  href: string
  className?: string
  // New optional props for enhanced features
  sparklineData?: number[]
  sparklineColor?: string
  comparisonText?: string // e.g., "+12% vs last month"
  subtitle?: string
  // Progress bar variant props
  variant?: 'default' | 'progress'
  progressValue?: number
  progressMax?: number
  progressColor?: 'primary' | 'success' | 'warning' | 'error'
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  change,
  changeLabel,
  changeDirection,
  href,
  className,
  // New props with defaults
  sparklineData,
  sparklineColor = '#16804d',
  comparisonText,
  subtitle,
  variant = 'default',
  progressValue,
  progressMax,
  progressColor = 'primary',
}: StatCardProps) {
  const isProgressVariant = variant === 'progress' && progressValue !== undefined && progressMax !== undefined

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white h-full',
          'shadow-sm transition-all duration-300 ease-out',
          'hover:shadow-lg hover:shadow-neutral-900/5 hover:border-neutral-300/60',
          'hover:-translate-y-0.5',
          'active:scale-[0.995] active:shadow-sm',
          isProgressVariant ? 'p-5' : 'p-4',
          className
        )}
      >
        {/* Subtle gradient overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300',
            'bg-gradient-to-br from-white via-transparent to-neutral-50/50',
            'group-hover:opacity-100'
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Top row: Icon and sparkline/arrow */}
          <div className="flex items-start justify-between gap-3 mb-3">
            {/* Icon container */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center',
                  'transition-all duration-300 ease-out',
                  'group-hover:scale-105 group-hover:shadow-md',
                  iconBg
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    'group-hover:scale-110',
                    iconColor
                  )}
                />
              </div>
            </div>

            {/* Right side: Sparkline or arrow */}
            {sparklineData && sparklineData.length >= 2 ? (
              <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkline
                  data={sparklineData}
                  strokeColor={sparklineColor}
                  fillColor={`${sparklineColor}15`}
                  width={72}
                  height={28}
                />
              </div>
            ) : (
              <ArrowRight
                className={cn(
                  'h-4 w-4 text-neutral-300 flex-shrink-0',
                  'transition-all duration-300',
                  'group-hover:text-neutral-400 group-hover:translate-x-0.5'
                )}
              />
            )}
          </div>

          {/* Value and title */}
          <div className="space-y-1">
            {/* Title - small label above value (Stripe pattern) */}
            <p
              className={cn(
                'text-[11px] font-semibold text-neutral-500 uppercase tracking-wider',
                'transition-colors duration-200',
                'group-hover:text-neutral-600'
              )}
            >
              {title}
            </p>

            {/* Main value - monospace for numbers */}
            <p
              className={cn(
                'text-2xl font-bold text-neutral-900 leading-tight tracking-tight',
                'transition-colors duration-200',
                'group-hover:text-neutral-950',
                // Use tabular nums for numeric values
                typeof value === 'number' || /^[\d$,.\-+%]+$/.test(String(value))
                  ? 'tabular-nums font-mono'
                  : ''
              )}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>

            {/* Subtitle (optional) */}
            {subtitle && (
              <p className="text-xs text-neutral-500 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Progress bar variant */}
          {isProgressVariant && (
            <div className="mt-4">
              <ProgressBar
                value={progressValue}
                max={progressMax}
                color={progressColor}
                size="sm"
              />
            </div>
          )}

          {/* Change indicator with comparison */}
          {!isProgressVariant && (change !== null && change !== undefined) && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <ChangeIndicator
                change={change}
                direction={changeDirection}
                comparisonLabel={comparisonText || changeLabel}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Compact stat card variant for secondary metrics
interface CompactStatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
  change?: string
  changeDirection?: 'up' | 'down' | 'neutral' | null
  href?: string
  className?: string
}

export function CompactStatCard({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-neutral-100',
  iconColor = 'text-neutral-600',
  change,
  changeDirection,
  href,
  className,
}: CompactStatCardProps) {
  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-neutral-200/60 bg-white p-3',
        'transition-all duration-200 ease-out',
        href && [
          'cursor-pointer',
          'hover:shadow-md hover:shadow-neutral-900/5 hover:border-neutral-300/60',
          'hover:-translate-y-0.5',
          'active:scale-[0.99]',
        ],
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
              iconBg
            )}
          >
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <p
              className={cn(
                'text-lg font-bold text-neutral-900 tabular-nums',
                typeof value === 'number' || /^[\d$,.\-+%]+$/.test(String(value))
                  ? 'font-mono'
                  : ''
              )}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <span
                className={cn(
                  'text-[10px] font-semibold tabular-nums',
                  changeDirection === 'up' && 'text-green-600',
                  changeDirection === 'down' && 'text-rose-600',
                  !changeDirection && 'text-neutral-500'
                )}
              >
                {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    )
  }

  return content
}

interface QuickActionCardProps {
  label: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  href: string
  className?: string
}

export function QuickActionCard({
  label,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  className,
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white p-4 h-full',
          'shadow-sm transition-all duration-300 ease-out',
          'hover:shadow-lg hover:shadow-neutral-900/5 hover:border-neutral-300/60',
          'hover:-translate-y-0.5 hover:scale-[1.01]',
          'active:scale-[0.99] active:shadow-sm',
          className
        )}
      >
        {/* Animated background gradient */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-300',
            'bg-gradient-to-br from-white via-transparent to-neutral-50/50',
            'group-hover:opacity-100'
          )}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
              'transition-all duration-300 ease-out',
              'group-hover:scale-105 group-hover:shadow-md',
              iconBg
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 transition-transform duration-300',
                'group-hover:scale-110',
                iconColor
              )}
            />
          </div>
          <p
            className={cn(
              'text-sm font-medium text-neutral-700 truncate',
              'transition-colors duration-200',
              'group-hover:text-neutral-900'
            )}
          >
            {label}
          </p>
          <ArrowRight
            className={cn(
              'h-4 w-4 text-neutral-300 flex-shrink-0 ml-auto',
              'transition-all duration-300',
              'group-hover:text-neutral-400 group-hover:translate-x-0.5'
            )}
          />
        </div>
      </div>
    </Link>
  )
}

// Usage quota card - Vercel-style for limits
interface UsageCardProps {
  title: string
  used: number
  limit: number
  unit?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  href?: string
  warningThreshold?: number // Percentage at which to show warning color
  className?: string
}

export function UsageCard({
  title,
  used,
  limit,
  unit = '',
  icon: Icon,
  iconBg,
  iconColor,
  href,
  warningThreshold = 80,
  className,
}: UsageCardProps) {
  const percentage = (used / limit) * 100
  const progressColor: 'success' | 'warning' | 'error' =
    percentage >= 100 ? 'error' : percentage >= warningThreshold ? 'warning' : 'success'

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white p-5 h-full',
        'transition-all duration-300 ease-out',
        href && [
          'cursor-pointer group',
          'hover:shadow-lg hover:shadow-neutral-900/5 hover:border-neutral-300/60',
          'hover:-translate-y-0.5',
          'active:scale-[0.995]',
        ],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center',
              'transition-all duration-300',
              href && 'group-hover:scale-105',
              iconBg
            )}
          >
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
              Usage
            </p>
          </div>
        </div>
        {href && (
          <ArrowRight
            className={cn(
              'h-4 w-4 text-neutral-300',
              'transition-all duration-300',
              'group-hover:text-neutral-400 group-hover:translate-x-0.5'
            )}
          />
        )}
      </div>

      {/* Value display */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-neutral-900 tabular-nums font-mono">
            {used.toLocaleString()}
          </span>
          <span className="text-sm text-neutral-500 font-medium">
            / {limit.toLocaleString()} {unit}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={used}
        max={limit}
        color={progressColor}
        showLabel={false}
        size="md"
      />

      {/* Percentage label */}
      <div className="flex justify-end mt-2">
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            progressColor === 'success' && 'text-green-600',
            progressColor === 'warning' && 'text-amber-600',
            progressColor === 'error' && 'text-rose-600'
          )}
        >
          {percentage.toFixed(1)}% used
        </span>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
