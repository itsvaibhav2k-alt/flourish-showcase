'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { CalendarEvent } from '../types/calendar.types'
import { EventPopoverContent } from './event-popover'
import { formatTime } from '../utils/calendar-utils'

interface CalendarEventBlockProps {
  event: CalendarEvent
  style?: React.CSSProperties
  variant?: 'week' | 'month'
}

export function CalendarEventBlock({
  event,
  style,
  variant = 'week',
}: CalendarEventBlockProps) {
  const [open, setOpen] = useState(false)

  const isShift = event.type === 'shift'
  const isCompleted = event.status === 'completed' || event.status === 'COMPLETED'

  // Color classes based on event type and status
  const colorClasses = isShift
    ? isCompleted
      ? 'bg-violet-100/60 border-violet-200/60 text-violet-600'
      : 'bg-violet-100 border-violet-300 text-violet-800 hover:bg-violet-200/80'
    : isCompleted
      ? 'bg-teal-100/60 border-teal-200/60 text-teal-600'
      : 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200/80'

  if (variant === 'month') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full px-2 py-0.5 rounded text-xs font-medium border',
              'truncate text-left cursor-pointer transition-colors',
              colorClasses
            )}
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full mr-1.5',
                isShift ? 'bg-violet-500' : 'bg-teal-500',
                isCompleted && 'opacity-60'
              )}
            />
            {event.title}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <EventPopoverContent event={event} onClose={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    )
  }

  // Week view variant
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'absolute left-1 right-1 px-2 py-1 rounded-md border text-xs font-medium',
            'text-left cursor-pointer transition-colors overflow-hidden',
            colorClasses
          )}
          style={style}
        >
          <div className="truncate font-medium">{event.title}</div>
          {isShift && event.endDate && (
            <div className="text-[10px] opacity-75 truncate">
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="right" align="start">
        <EventPopoverContent event={event} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
