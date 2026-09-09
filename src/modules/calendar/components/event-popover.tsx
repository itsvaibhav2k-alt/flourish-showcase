'use client'

import Link from 'next/link'
import { Calendar, Clock, MapPin, User, CheckCircle2, Circle, Pencil, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarEvent, ShiftMetadata, TaskMetadata } from '../types/calendar.types'
import { formatTime, formatShortDate } from '../utils/calendar-utils'

interface EventPopoverContentProps {
  event: CalendarEvent
  onClose?: () => void
}

export function EventPopoverContent({ event, onClose }: EventPopoverContentProps) {
  const isShift = event.type === 'shift'
  const isCompleted = event.status === 'completed' || event.status === 'COMPLETED'

  const detailUrl = isShift
    ? `/volunteers/shifts/${event.id}`
    : `/contacts/${(event.metadata as TaskMetadata).contactId}`

  const editUrl = isShift
    ? `/volunteers/shifts/${event.id}/edit`
    : `/contacts/${(event.metadata as TaskMetadata).contactId}` // Tasks are edited on contact page

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`h-3 w-3 rounded-full mt-1.5 ${
            isShift ? 'bg-violet-500' : 'bg-teal-500'
          }`}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{event.title}</h3>
          <p className="text-sm text-neutral-500">
            {isShift ? 'Volunteer Shift' : 'Task'}
          </p>
        </div>
        {isCompleted && (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {/* Date and Time */}
        <div className="flex items-center gap-2 text-neutral-600">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <span>{formatShortDate(event.startDate)}</span>
        </div>

        {isShift && event.endDate && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span>
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
          </div>
        )}

        {/* Shift-specific info */}
        {isShift && (
          <>
            {(event.metadata as ShiftMetadata).location && (
              <div className="flex items-center gap-2 text-neutral-600">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <span>{(event.metadata as ShiftMetadata).location}</span>
              </div>
            )}
            {(event.metadata as ShiftMetadata).capacity && (
              <div className="flex items-center gap-2 text-neutral-600">
                <User className="h-4 w-4 text-neutral-400" />
                <span>
                  {(event.metadata as ShiftMetadata).confirmedSignups} /{' '}
                  {(event.metadata as ShiftMetadata).capacity} volunteers
                </span>
              </div>
            )}
          </>
        )}

        {/* Task-specific info */}
        {!isShift && (
          <>
            <div className="flex items-center gap-2 text-neutral-600">
              <User className="h-4 w-4 text-neutral-400" />
              <span>{(event.metadata as TaskMetadata).contactName}</span>
            </div>
            {(event.metadata as TaskMetadata).description && (
              <p className="text-neutral-500 text-xs mt-2 line-clamp-2">
                {(event.metadata as TaskMetadata).description}
              </p>
            )}
          </>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-neutral-600">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-neutral-400" />
          )}
          <span className="capitalize">{event.status.toLowerCase()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-neutral-100 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={editUrl} onClick={onClose}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link href={detailUrl} onClick={onClose}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View
          </Link>
        </Button>
      </div>
    </div>
  )
}
