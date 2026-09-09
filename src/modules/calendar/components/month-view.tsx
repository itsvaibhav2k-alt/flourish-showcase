'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { CalendarDayCell } from './calendar-day-cell'
import { getMonthWeeks, groupEventsByDate } from '../utils/calendar-utils'
import type { CalendarEvent } from '../types/calendar.types'

interface MonthViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ events, currentDate }: MonthViewProps) {
  const weeks = useMemo(() => getMonthWeeks(currentDate), [currentDate])
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])

  return (
    <div className="p-4" data-testid="month-view">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-neutral-500 text-center py-2 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7 border-t border-l border-neutral-200/60 rounded-lg overflow-hidden"
        data-testid="month-grid"
      >
        {weeks.flat().map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd')
          return (
            <CalendarDayCell
              key={date.toISOString()}
              date={date}
              events={eventsByDate[dateKey] || []}
              currentMonth={currentDate}
            />
          )
        })}
      </div>
    </div>
  )
}
