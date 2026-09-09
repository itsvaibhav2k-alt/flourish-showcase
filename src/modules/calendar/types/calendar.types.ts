export type CalendarEventType = 'shift' | 'task'

export type CalendarViewMode = 'week' | 'month'

export interface ShiftMetadata {
  location: string | null
  capacity: number | null
  confirmedSignups: number
  fillRate: number
}

export interface TaskMetadata {
  contactId: string
  contactName: string
  description: string | null
}

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  startDate: Date
  endDate: Date | null // null for tasks (single day)
  status: string
  metadata: ShiftMetadata | TaskMetadata
}

export interface CalendarState {
  currentDate: Date
  viewMode: CalendarViewMode
  events: CalendarEvent[]
}

export interface GetCalendarEventsOptions {
  startDate: string // ISO date string
  endDate: string // ISO date string
}
