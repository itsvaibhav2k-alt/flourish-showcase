'use client'

import { CalendarDays, Users, CheckSquare, Clock } from 'lucide-react'
import { CalendarView, NewEventDropdown, type CalendarEvent } from '@/modules/calendar'

const iconColors = {
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
} as const

type IconColorKey = keyof typeof iconColors

interface CalendarPageClientProps {
  events: CalendarEvent[]
  stats: {
    totalShifts: number
    totalTasks: number
    volunteersNeeded: number
    upcomingThisWeek: number
  }
  initialDate: Date
}

export function CalendarPageClient({ events, stats, initialDate }: CalendarPageClientProps) {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Calendar</h1>
            <p className="text-neutral-500 mt-1">
              View your shifts and tasks at a glance
            </p>
          </div>
          <NewEventDropdown />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            icon={CalendarDays}
            iconColor="violet"
            label="Shifts This Week"
            value={stats.totalShifts}
          />
          <StatsCard
            icon={CheckSquare}
            iconColor="teal"
            label="Tasks This Week"
            value={stats.totalTasks}
          />
          <StatsCard
            icon={Users}
            iconColor="amber"
            label="Volunteers Needed"
            value={stats.volunteersNeeded}
          />
          <StatsCard
            icon={Clock}
            iconColor="rose"
            label="Upcoming Items"
            value={stats.upcomingThisWeek}
          />
        </div>

        {/* Calendar View */}
        <div>
          <CalendarView initialEvents={events} initialDate={initialDate} />
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  icon: React.ElementType
  iconColor: IconColorKey
  label: string
  value: number
}

function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-card border border-neutral-200/60">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ${iconColors[iconColor].bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColors[iconColor].text}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-neutral-900">{value}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  )
}
