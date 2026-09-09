'use client'

import { useState, useTransition, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { CalendarHeader } from './calendar-header'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import { getCalendarEvents } from '../queries/get-calendar-events'
import { navigateDate, getDateRange } from '../utils/calendar-utils'
import type { CalendarEvent, CalendarViewMode } from '../types/calendar.types'

interface CalendarViewProps {
  initialEvents: CalendarEvent[]
  initialDate?: Date
}

export function CalendarView({
  initialEvents,
  initialDate = new Date(),
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week')
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [events, setEvents] = useState(initialEvents)
  const [isPending, startTransition] = useTransition()

  const fetchEvents = useCallback(
    async (date: Date, mode: CalendarViewMode) => {
      const { startDate, endDate } = getDateRange(date, mode)
      const newEvents = await getCalendarEvents({ startDate, endDate })
      return newEvents
    },
    []
  )

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      startTransition(async () => {
        const newDate = navigateDate(currentDate, direction, viewMode)
        setCurrentDate(newDate)

        try {
          const newEvents = await fetchEvents(newDate, viewMode)
          setEvents(newEvents)
        } catch (error) {
          console.error('Failed to fetch events:', error)
        }
      })
    },
    [currentDate, viewMode, fetchEvents]
  )

  const handleViewModeChange = useCallback(
    (mode: CalendarViewMode) => {
      setViewMode(mode)

      startTransition(async () => {
        try {
          const newEvents = await fetchEvents(currentDate, mode)
          setEvents(newEvents)
        } catch (error) {
          console.error('Failed to fetch events:', error)
        }
      })
    },
    [currentDate, fetchEvents]
  )

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onNavigate={handleNavigate}
        isLoading={isPending}
      />
      {viewMode === 'week' ? (
        <WeekView events={events} currentDate={currentDate} />
      ) : (
        <MonthView events={events} currentDate={currentDate} />
      )}
    </Card>
  )
}
