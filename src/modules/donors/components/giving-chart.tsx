'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getGivingHistory, type GivingHistoryData, type TimeRange } from '../queries/get-giving-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

/**
 * Chart data point with month info
 */
interface ChartDataPoint {
  month: string
  total: number
  count: number
  monthLabel: string
}

/**
 * Custom tooltip props for the giving chart
 */
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ChartDataPoint
  }>
}

/**
 * Client component that displays a bar chart of monthly giving trends
 * Shows giving data with year-over-year comparison and time range filter
 */
export function GivingChart() {
  const [data, setData] = useState<GivingHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('12months')

  const fetchData = async (range: TimeRange) => {
    try {
      setLoading(true)
      setError(null)
      const historyData = await getGivingHistory(range)
      setData(historyData)
    } catch (err) {
      console.error('Error fetching giving history:', err)
      setError('Failed to load giving history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(timeRange)
  }, [timeRange])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format month name from "2024-01" to "Jan"
  const formatMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('en-US', { month: 'short' })
  }

  // Custom tooltip component with proper types
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const chartData = payload[0].payload
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-md p-3">
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {formatMonthName(chartData.month)}
          </p>
          <p className="text-lg font-semibold text-violet-600">
            {formatCurrency(chartData.total)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {chartData.count} {chartData.count === 1 ? 'gift' : 'gifts'}
          </p>
        </div>
      )
    }
    return null
  }

  // Time range labels
  const timeRangeLabels: Record<TimeRange, string> = {
    month: 'This Month',
    '3months': 'Last 3 Months',
    '12months': 'Last 12 Months',
    all: 'All Time',
  }

  if (loading) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Giving Trends
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-[200px] bg-neutral-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Giving Trends
            </CardTitle>
            <div className="flex gap-2">
              {(['month', '3months', '12months', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? 'bg-violet-600 hover:bg-violet-700' : ''}
                >
                  {timeRangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600 mb-1">Failed to load giving history</p>
            <p className="text-xs text-neutral-400 mb-4">
              There was an error loading the chart data
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(timeRange)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  // Prepare chart data
  const chartData = data.monthly.map((item) => ({
    ...item,
    monthLabel: formatMonthName(item.month),
  }))

  const hasData = data.monthly.some((item) => item.total > 0)
  const isPositiveChange = data.yearOverYear.percentChange >= 0

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Giving Trends
            </CardTitle>
            <p className="text-xs text-neutral-500 mt-1">{timeRangeLabels[timeRange]}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time range filter */}
            <div className="flex gap-2">
              {(['month', '3months', '12months', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? 'bg-violet-600 hover:bg-violet-700' : ''}
                >
                  {timeRangeLabels[range]}
                </Button>
              ))}
            </div>

            {/* Year-over-year comparison */}
            {hasData && data.yearOverYear.previousYear > 0 && (
              <div className="text-right">
                <div className={`flex items-center gap-1 ${isPositiveChange ? 'text-green-600' : 'text-rose-600'}`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {Math.abs(data.yearOverYear.percentChange)}%
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">vs last year</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-violet-300" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No giving data for this period</p>
              <p className="text-xs text-neutral-400 mt-1">
                {timeRange === 'all'
                  ? 'Record gifts to see trends'
                  : 'Try selecting a different time range or record new gifts'}
              </p>
            </div>
          </div>
        ) : (
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
        )}

        {/* Summary stats below chart */}
        {hasData && (
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-100">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                This Year
              </p>
              <p className="text-xl font-semibold text-neutral-900 mt-1">
                {formatCurrency(data.yearOverYear.currentYear)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                Last Year
              </p>
              <p className="text-xl font-semibold text-neutral-900 mt-1">
                {formatCurrency(data.yearOverYear.previousYear)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
