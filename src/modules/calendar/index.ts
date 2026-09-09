// Types
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarViewMode,
  CalendarState,
  ShiftMetadata,
  TaskMetadata,
  GetCalendarEventsOptions,
} from './types/calendar.types'

// Queries
export { getCalendarEvents } from './queries/get-calendar-events'

// Utils
export {
  getWeekDays,
  getMonthWeeks,
  calculateEventPosition,
  groupEventsByDay,
  groupEventsByDate,
  formatWeekRange,
  formatMonthYear,
  navigateDate,
  getDateRange,
  formatTime,
  formatShortDate,
  isToday,
  isSameMonth,
  isSameDay,
} from './utils/calendar-utils'

// Components
export { CalendarView } from './components/calendar-view'
export { CalendarHeader } from './components/calendar-header'
export { WeekView } from './components/week-view'
export { MonthView } from './components/month-view'
export { CalendarEventBlock } from './components/calendar-event'
export { CalendarDayCell } from './components/calendar-day-cell'
export { EventPopoverContent } from './components/event-popover'
export { AddEventPopoverContent } from './components/add-event-popover'
export { NewEventDropdown } from './components/new-event-dropdown'
