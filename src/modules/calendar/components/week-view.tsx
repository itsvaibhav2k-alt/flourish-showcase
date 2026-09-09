'use client'

import { useMemo, useState } from 'react'
import { format, setHours } from 'date-fns'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarEventBlock } from './calendar-event'
import { AddEventPopoverContent } from './add-event-popover'
import { NewTaskDialog } from './new-task-dialog'
import {
  getWeekDays,
  groupEventsByDay,
  calculateEventPosition,
  isToday,
} from '../utils/calendar-utils'
import type { CalendarEvent } from '../types/calendar.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface WeekViewProps {
  events: CalendarEvent[]
  currentDate: Date
}

const HOUR_HEIGHT = 60 // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const VISIBLE_HOURS = HOURS.filter((h) => h >= 6 && h <= 22) // 6 AM to 10 PM

export function WeekView({ events, currentDate }: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  // Group events by day index
  const eventsByDay = useMemo(
    () => groupEventsByDay(events, weekDays),
    [events, weekDays]
  )

  return (
    <div className="flex flex-col" data-testid="week-view">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200/60">
        <div className="p-2" /> {/* Empty corner */}
        {weekDays.map((day) => (
          <DayHeader key={day.toISOString()} date={day} />
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] flex-1 overflow-auto max-h-[calc(100vh-320px)] min-h-[480px]">
        {/* Time labels column */}
        <div className="border-r border-neutral-200/60">
          {VISIBLE_HOURS.map((hour) => (
            <TimeLabel key={hour} hour={hour} />
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            events={eventsByDay.get(dayIndex) || []}
          />
        ))}
      </div>
    </div>
  )
}

interface DayHeaderProps {
  date: Date
}

function DayHeader({ date }: DayHeaderProps) {
  const dayIsToday = isToday(date)

  return (
    <div
      className={cn(
        'p-2 text-center border-l border-neutral-200/60',
        dayIsToday && 'bg-violet-50/50'
      )}
      data-testid="day-header"
    >
      <div className="text-xs font-medium text-neutral-500 uppercase">
        {format(date, 'EEE')}
      </div>
      <div
        className={cn(
          'text-lg font-semibold',
          dayIsToday
            ? 'h-8 w-8 mx-auto rounded-full bg-violet-600 text-white flex items-center justify-center'
            : 'text-neutral-900'
        )}
      >
        {format(date, 'd')}
      </div>
    </div>
  )
}

interface TimeLabelProps {
  hour: number
}

function TimeLabel({ hour }: TimeLabelProps) {
  const formatHour = (h: number) => {
    if (h === 0) return '12 AM'
    if (h === 12) return '12 PM'
    if (h < 12) return `${h} AM`
    return `${h - 12} PM`
  }

  return (
    <div
      className="h-[60px] pr-2 text-right text-xs text-neutral-400 pt-[-6px] relative"
      style={{ height: `${HOUR_HEIGHT}px` }}
    >
      <span className="absolute right-2 -top-2">{formatHour(hour)}</span>
    </div>
  )
}

interface DayColumnProps {
  date: Date
  events: CalendarEvent[]
}

function DayColumn({ date, events }: DayColumnProps) {
  const dayIsToday = isToday(date)

  // Filter to visible hours only (6 AM - 10 PM)
  const visibleEvents = events.filter((event) => {
    const hour = event.startDate.getHours()
    return hour >= 6 && hour <= 22
  })

  return (
    <div
      className={cn(
        'relative border-l border-neutral-200/60',
        dayIsToday && 'bg-violet-50/30'
      )}
    >
      {/* Hour grid lines - clickable for adding events */}
      {VISIBLE_HOURS.map((hour) => (
        <TimeSlot key={hour} date={date} hour={hour} />
      ))}

      {/* Events */}
      {visibleEvents.map((event) => {
        const { top, height } = calculateEventPosition(event, HOUR_HEIGHT)
        // Adjust position for 6 AM start
        const adjustedTop = top - 6 * HOUR_HEIGHT

        return (
          <CalendarEventBlock
            key={event.id}
            event={event}
            style={{
              top: `${adjustedTop}px`,
              height: `${height}px`,
            }}
            variant="week"
          />
        )
      })}
    </div>
  )
}

interface TimeSlotProps {
  date: Date
  hour: number
}

function TimeSlot({ date, hour }: TimeSlotProps) {
  const [open, setOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const slotDate = setHours(date, hour)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className="border-b border-neutral-100 cursor-pointer hover:bg-violet-50/50 transition-colors group relative"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            {/* Plus icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="h-5 w-5 text-violet-400" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start" side="right">
          <AddEventPopoverContent
            date={slotDate}
            hour={hour}
            onClose={() => setOpen(false)}
            onNewTask={() => setTaskDialogOpen(true)}
          />
        </PopoverContent>
      </Popover>

      <NewTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        defaultDate={slotDate}
      />
    </>
  )
}
