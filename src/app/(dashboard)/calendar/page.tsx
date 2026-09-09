import { getCalendarEvents, getDateRange, type CalendarEvent } from '@/modules/calendar'
import { CalendarPageClient } from './calendar-page-client'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  // Get current week's events for initial render
  const today = new Date()
  const { startDate, endDate } = getDateRange(today, 'week')

  let events: CalendarEvent[] = []
  let stats = {
    totalShifts: 0,
    totalTasks: 0,
    volunteersNeeded: 0,
    upcomingThisWeek: 0,
  }

  try {
    events = await getCalendarEvents({ startDate, endDate })

    // Calculate stats
    const shifts = events.filter((e) => e.type === 'shift')
    const tasks = events.filter((e) => e.type === 'task')

    stats = {
      totalShifts: shifts.length,
      totalTasks: tasks.length,
      volunteersNeeded: shifts.reduce((sum, shift) => {
        const meta = shift.metadata as { capacity?: number; confirmedSignups?: number }
        if (meta.capacity) {
          return sum + (meta.capacity - (meta.confirmedSignups || 0))
        }
        return sum
      }, 0),
      upcomingThisWeek: events.filter(
        (e) => e.status !== 'completed' && e.status !== 'COMPLETED'
      ).length,
    }
  } catch (error) {
    console.error('Failed to fetch calendar events:', error)
  }

  return (
    <CalendarPageClient
      events={events}
      stats={stats}
      initialDate={today}
    />
  )
}
