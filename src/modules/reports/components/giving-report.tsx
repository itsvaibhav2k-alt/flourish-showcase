'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign } from 'lucide-react'
import { getGivingByMonth, type GivingByMonth } from '../queries/get-giving-by-month'

interface GivingReportProps {
  startDate?: string
  endDate?: string
  campaign?: string
}

/**
 * Enhanced giving visualization with summary stats
 */
export function GivingReport({ startDate, endDate, campaign }: GivingReportProps) {
  const [data, setData] = useState<GivingByMonth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const givingData = await getGivingByMonth({ startDate, endDate, campaign })
        setData(givingData)
      } catch (error) {
        console.error('Error fetching giving report:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, campaign])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format month name
  const formatMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('en-US', { month: 'short' })
  }

  // Calculate summary stats
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0)
  const totalGifts = data.reduce((sum, item) => sum + item.count, 0)
  const averageGift = totalGifts > 0 ? totalAmount / totalGifts : 0

  // Calculate growth (compare first half vs second half)
  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint).reduce((sum, item) => sum + item.total, 0)
  const secondHalf = data.slice(midpoint).reduce((sum, item) => sum + item.total, 0)
  const growth =
    firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-md p-3">
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {formatMonthName(data.month)}
          </p>
          <p className="text-lg font-semibold text-violet-600">
            {formatCurrency(data.total)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {data.count} {data.count === 1 ? 'gift' : 'gifts'}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Giving by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-[200px] bg-neutral-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonthName(item.month),
  }))

  const hasData = data.some((item) => item.total > 0)

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">
          Giving by Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-600">No giving data</p>
              <p className="text-xs text-neutral-400 mt-1">
                Adjust date range or record gifts to see data
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <YAxis
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
                  <Bar
                    dataKey="total"
                    fill="#16804d"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-100">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total
                </p>
                <p className="text-xl font-semibold text-neutral-900 mt-1">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {totalGifts} {totalGifts === 1 ? 'gift' : 'gifts'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Average</p>
                <p className="text-xl font-semibold text-neutral-900 mt-1">
                  {formatCurrency(averageGift)}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">per gift</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Growth
                </p>
                <p
                  className={`text-xl font-semibold mt-1 ${
                    growth >= 0 ? 'text-green-600' : 'text-rose-600'
                  }`}
                >
                  {growth >= 0 ? '+' : ''}
                  {growth.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">period over period</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
