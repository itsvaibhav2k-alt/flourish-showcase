import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  differenceInMinutes,
  isToday,
  getDay,
  addDays,
  subDays,
} from 'date-fns'
import type { CalendarEvent } from '../types/calendar.types'

/**
 * Get array of 7 days for a week view
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 }) // Saturday
  return eachDayOfInterval({ start, end })
}

/**
 * Get weeks of a month for month view (returns array of weeks, each with 7 days)
 */
export function getMonthWeeks(date: Date): Date[][] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)

  // Get the start of the week containing the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  // Get the end of the week containing the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Split into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  return weeks
}

/**
 * Calculate position and height for an event in week view
 * Returns top position and height in pixels based on 60px per hour
 */
export function calculateEventPosition(
  event: CalendarEvent,
  hourHeight: number = 60
): { top: number; height: number } {
  const startHour = event.startDate.getHours()
  const startMinutes = event.startDate.getMinutes()
  const top = startHour * hourHeight + (startMinutes / 60) * hourHeight

  if (event.endDate) {
    const duration = differenceInMinutes(event.endDate, event.startDate)
    const height = (duration / 60) * hourHeight
    return { top, height: Math.max(height, 24) } // Minimum 24px height
  }

  // Tasks are fixed height
  return { top, height: 28 }
}

/**
 * Group events by day for week view
 */
export function groupEventsByDay(
  events: CalendarEvent[],
  days: Date[]
): Map<number, CalendarEvent[]> {
  const eventsByDay = new Map<number, CalendarEvent[]>()

  // Initialize all days
  days.forEach((_, index) => {
    eventsByDay.set(index, [])
  })

  events.forEach((event) => {
    days.forEach((day, index) => {
      if (isSameDay(event.startDate, day)) {
        const dayEvents = eventsByDay.get(index) || []
        dayEvents.push(event)
        eventsByDay.set(index, dayEvents)
      }
    })
  })

  return eventsByDay
}

/**
 * Group events by date string for month view
 */
export function groupEventsByDate(
  events: CalendarEvent[]
): Record<string, CalendarEvent[]> {
  const eventsByDate: Record<string, CalendarEvent[]> = {}

  events.forEach((event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd')
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = []
    }
    eventsByDate[dateKey].push(event)
  })

  return eventsByDate
}

/**
 * Format week range for header display (e.g., "Dec 8 - 14, 2025")
 */
export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })

  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
}

/**
 * Format month for header display (e.g., "December 2025")
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/**
 * Navigate to previous/next period
 */
export function navigateDate(
  date: Date,
  direction: 'prev' | 'next' | 'today',
  viewMode: 'week' | 'month'
): Date {
  if (direction === 'today') {
    return new Date()
  }

  if (viewMode === 'week') {
    return direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1)
  }

  return direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1)
}

/**
 * Get date range for fetching events based on view mode
 */
export function getDateRange(
  date: Date,
  viewMode: 'week' | 'month'
): { startDate: string; endDate: string } {
  if (viewMode === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    const end = endOfWeek(date, { weekStartsOn: 0 })
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }

  // For month view, include days from adjacent months that appear in the grid
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return {
    startDate: calendarStart.toISOString(),
    endDate: calendarEnd.toISOString(),
  }
}

/**
 * Format time for display (e.g., "9:00 AM")
 */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a')
}

/**
 * Format date for display (e.g., "Dec 10")
 */
export function formatShortDate(date: Date): string {
  return format(date, 'MMM d')
}

/**
 * Check if a date is today
 */
export { isToday, isSameMonth, isSameDay }
