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
import { Clock, Users } from 'lucide-react'
import { getVolunteerHours, type VolunteerHoursByMonth } from '../queries/get-volunteer-hours'

interface VolunteerReportProps {
  startDate?: string
  endDate?: string
}

/**
 * Volunteer hours chart with summary stats
 */
export function VolunteerReport({ startDate, endDate }: VolunteerReportProps) {
  const [data, setData] = useState<VolunteerHoursByMonth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const hoursData = await getVolunteerHours({ startDate, endDate })
        setData(hoursData)
      } catch (error) {
        console.error('Error fetching volunteer hours:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  // Format month name
  const formatMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('en-US', { month: 'short' })
  }

  // Calculate summary stats
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0)
  const uniqueVolunteers = new Set(
    data.flatMap((item) => Array(item.volunteers).fill(null))
  ).size
  // Get unique volunteer count properly
  const maxVolunteers = Math.max(...data.map((item) => item.volunteers), 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-md p-3">
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {formatMonthName(data.month)}
          </p>
          <p className="text-lg font-semibold text-teal-600">{data.hours} hours</p>
          <p className="text-xs text-neutral-500 mt-1">
            {data.volunteers} {data.volunteers === 1 ? 'volunteer' : 'volunteers'}
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
            Volunteer Hours by Month
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

  const hasData = data.some((item) => item.hours > 0)

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900">
          Volunteer Hours by Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-600">No volunteer data</p>
              <p className="text-xs text-neutral-400 mt-1">
                Adjust date range or create shifts to see data
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
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdfa' }} />
                  <Bar
                    dataKey="hours"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-100">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Total Hours
                </p>
                <p className="text-xl font-semibold text-neutral-900 mt-1">
                  {totalHours.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">this period</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Volunteers
                </p>
                <p className="text-xl font-semibold text-neutral-900 mt-1">
                  {maxVolunteers.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">unique contributors</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
