'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  DollarSign,
  Users,
  UserPlus,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

// Sparkline component
function Sparkline({
  data,
  width = 72,
  height = 28,
  strokeColor = '#16804d',
  fillColor,
}: {
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  fillColor?: string
}) {
  const computedFillColor = fillColor || `${strokeColor}15`

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
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${strokeColor.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={computedFillColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#sparkline-gradient-${strokeColor.replace('#', '')})`}
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

// Icon mapping
const iconMap = {
  'dollar-sign': DollarSign,
  users: Users,
  'user-plus': UserPlus,
  mail: Mail,
}

type IconName = keyof typeof iconMap

export interface StatCardData {
  title: string
  value: string
  iconName: IconName
  iconBg: string
  iconColor: string
  change: string | null
  changeLabel: string
  changeDirection: 'up' | 'down' | 'neutral' | null
  href: string
  sparklineData: number[]
  sparklineColor: string
}

interface DashboardStatsGridProps {
  stats: StatCardData[]
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.iconName]
        return (
          <Link key={stat.title} href={stat.href} className="block group">
            <Card className="shadow-sm border-neutral-200/60 hover:shadow-lg hover:shadow-neutral-900/5 hover:border-neutral-300/60 transition-all duration-300 cursor-pointer bg-white h-full hover:-translate-y-0.5">
              <CardContent className="p-5">
                {/* Top row: Icon and sparkline */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={cn(
                      'h-11 w-11 rounded-xl flex items-center justify-center',
                      'transition-all duration-300 ease-out',
                      'group-hover:shadow-md',
                      stat.iconBg
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-300',
                        stat.iconColor
                      )}
                    />
                  </div>

                  {/* Sparkline */}
                  {stat.sparklineData && stat.sparklineData.length >= 2 && (
                    <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkline
                        data={stat.sparklineData}
                        strokeColor={stat.sparklineColor}
                      />
                    </div>
                  )}
                </div>

                {/* Value and title */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider transition-colors duration-200 group-hover:text-neutral-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 leading-tight tracking-tight tabular-nums transition-colors duration-200 group-hover:text-neutral-950">
                    {stat.value}
                  </p>
                </div>

                {/* Change indicator */}
                {stat.change !== null && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={cn(
                          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md',
                          'text-xs font-semibold tabular-nums transition-all duration-200',
                          stat.changeDirection === 'up' && 'bg-green-50 text-green-700 ring-1 ring-green-100',
                          stat.changeDirection === 'down' && 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
                          !stat.changeDirection && 'bg-neutral-50 text-neutral-600 ring-1 ring-neutral-100'
                        )}
                      >
                        {stat.changeDirection === 'up' && <ArrowUpRight className="h-3 w-3" />}
                        {stat.changeDirection === 'down' && <ArrowDownRight className="h-3 w-3" />}
                        {!stat.changeDirection && <Minus className="h-3 w-3" />}
                        <span>{stat.change}</span>
                      </div>
                      {stat.changeLabel && (
                        <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
                          {stat.changeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Show label if no change */}
                {stat.change === null && stat.changeLabel && (
                  <p className="mt-2 text-xs text-neutral-400 font-medium">
                    {stat.changeLabel}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
