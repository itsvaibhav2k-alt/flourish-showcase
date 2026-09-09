'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { getGivingHistory } from '../queries/get-giving-history'

interface SparklineData {
  value: number
}

interface DonorStatsSparklineProps {
  type: 'giving' // Can be extended in the future for other stat types
}

/**
 * Mini sparkline component that shows trend for donor statistics
 * Displays a small line chart (50px height) with no axes
 */
export function DonorStatsSparkline({ type }: DonorStatsSparklineProps) {
  const [data, setData] = useState<SparklineData[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        if (type === 'giving') {
          const historyData = await getGivingHistory()

          // Take last 6 months for sparkline
          const sparklineData = historyData.monthly.slice(-6).map((item) => ({
            value: item.total,
          }))

          setData(sparklineData)

          // Calculate trend
          if (sparklineData.length >= 2) {
            const firstValue = sparklineData[0].value
            const lastValue = sparklineData[sparklineData.length - 1].value

            if (lastValue > firstValue * 1.05) {
              setTrend('up')
            } else if (lastValue < firstValue * 0.95) {
              setTrend('down')
            } else {
              setTrend('flat')
            }
          }
        }
      } catch (err) {
        console.error('Error fetching sparkline data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [type])

  if (loading || data.length === 0) {
    return (
      <div className="h-[50px] w-full flex items-center justify-center">
        <div className="h-1 w-full bg-neutral-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const lineColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#f43f5e' : '#78716c'

  return (
    <div className="h-[50px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Wrapper component for enhanced stat cards with sparklines
 * Can be used to wrap existing stat card content
 */
interface StatCardWithSparklineProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  iconBg?: string
  highlight?: string
  showSparkline?: boolean
  sparklineType?: 'giving'
}

export function StatCardWithSparkline({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-neutral-100',
  highlight,
  showSparkline = false,
  sparklineType = 'giving',
}: StatCardWithSparklineProps) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={`text-2xl font-semibold tracking-tight ${highlight || 'text-neutral-900'}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline at bottom of card */}
      {showSparkline && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <DonorStatsSparkline type={sparklineType} />
        </div>
      )}
    </div>
  )
}
