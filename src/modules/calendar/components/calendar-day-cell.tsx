'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarEventBlock } from './calendar-event'
import { AddEventPopoverContent } from './add-event-popover'
import { NewTaskDialog } from './new-task-dialog'
import { isToday, isSameMonth } from '../utils/calendar-utils'
import type { CalendarEvent } from '../types/calendar.types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CalendarDayCellProps {
  date: Date
  events: CalendarEvent[]
  currentMonth: Date
}

const MAX_VISIBLE_EVENTS = 3

export function CalendarDayCell({
  date,
  events,
  currentMonth,
}: CalendarDayCellProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const dayIsToday = isToday(date)
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const hasOverflow = events.length > MAX_VISIBLE_EVENTS
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS)
  const hiddenEvents = events.slice(MAX_VISIBLE_EVENTS)

  return (
    <div
      className={cn(
        'min-h-[100px] p-1 bg-white border-b border-r border-neutral-200/60 group relative',
        !isCurrentMonth && 'bg-neutral-50/50'
      )}
    >
      {/* Day number and add button */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'flex items-center justify-center text-sm font-medium ml-1',
            dayIsToday
              ? 'h-7 w-7 rounded-full bg-violet-600 text-white'
              : isCurrentMonth
                ? 'text-neutral-900'
                : 'text-neutral-400'
          )}
        >
          {format(date, 'd')}
        </span>

        {/* Add event button */}
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'h-6 w-6 rounded-md flex items-center justify-center transition-all',
                'opacity-0 group-hover:opacity-100 hover:bg-violet-100 text-violet-600'
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <AddEventPopoverContent
              date={date}
              onClose={() => setAddOpen(false)}
              onNewTask={() => setTaskDialogOpen(true)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* New Task Dialog */}
      <NewTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        defaultDate={date}
      />

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <CalendarEventBlock
            key={event.id}
            event={event}
            variant="month"
          />
        ))}

        {/* Show more button */}
        {hasOverflow && (
          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild>
              <button className="w-full text-xs text-neutral-500 hover:text-neutral-700 text-left px-2 py-0.5 hover:bg-neutral-100 rounded transition-colors">
                +{hiddenEvents.length} more
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="text-xs font-medium text-neutral-500 mb-2">
                {format(date, 'EEEE, MMMM d')}
              </div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {events.map((event) => (
                  <CalendarEventBlock
                    key={event.id}
                    event={event}
                    variant="month"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
