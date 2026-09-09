'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { TeamMemberStatsNew } from '../queries'

interface ActivityChartProps {
  members: TeamMemberStatsNew[]
  dateRange: '7d' | '30d' | '90d' | 'all'
}

export function ActivityChart({ members, dateRange }: ActivityChartProps) {
  // Prepare data for the chart - top 10 members by total activity
  const chartData = [...members]
    .sort((a, b) => b.total_activities - a.total_activities)
    .slice(0, 10)
    .map((member) => ({
      name: member.full_name || member.email.split('@')[0],
      emails: member.emails_sent,
      gifts: member.gifts_recorded,
      contacts: member.contacts_added,
      notes: member.notes_added,
    }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-md p-3">
          <p className="font-semibold text-neutral-900 mb-2">{data.name}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-neutral-600 capitalize">{entry.dataKey}:</span>
              </span>
              <span className="font-semibold text-neutral-900">{entry.value}</span>
            </div>
          ))}
          <div className="border-t border-neutral-200 mt-2 pt-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-neutral-600">Total:</span>
              <span className="text-neutral-900">
                {data.emails + data.gifts + data.contacts + data.notes}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const getChartTitle = () => {
    switch (dateRange) {
      case '7d':
        return 'Team Activity (Last 7 Days)'
      case '30d':
        return 'Team Activity (Last 30 Days)'
      case '90d':
        return 'Team Activity (Last 90 Days)'
      case 'all':
        return 'Team Activity (All Time)'
      default:
        return 'Team Activity'
    }
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-600" />
          {getChartTitle()}
        </CardTitle>
        <p className="text-sm text-neutral-500 mt-1">
          Top 10 most active team members
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-8">
            No activity data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="name"
                stroke="#78716c"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#78716c"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-neutral-600 capitalize">{value}</span>
                )}
              />
              <Bar dataKey="emails" stackId="a" fill="#22a558" radius={[0, 0, 0, 0]} />
              <Bar dataKey="gifts" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="contacts" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="notes" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
