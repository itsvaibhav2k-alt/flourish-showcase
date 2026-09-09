'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { UserPlus, CheckSquare, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddEventPopoverContentProps {
  date: Date
  hour?: number // Optional hour for week view
  onClose?: () => void
  onNewTask?: () => void
}

export function AddEventPopoverContent({
  date,
  hour,
  onClose,
  onNewTask,
}: AddEventPopoverContentProps) {
  // Format the date for URL params
  const dateStr = format(date, 'yyyy-MM-dd')

  // Create URLs with pre-filled date
  const newShiftUrl = hour !== undefined
    ? `/volunteers/shifts/new?date=${dateStr}&hour=${hour}`
    : `/volunteers/shifts/new?date=${dateStr}`

  const handleNewTask = () => {
    onClose?.()
    onNewTask?.()
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <Calendar className="h-4 w-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-700">
          {format(date, 'EEEE, MMM d')}
          {hour !== undefined && ` at ${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-violet-700 hover:text-violet-800 hover:bg-violet-50"
        >
          <Link href={newShiftUrl} onClick={onClose}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Volunteer Shift
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-teal-700 hover:text-teal-800 hover:bg-teal-50"
          onClick={handleNewTask}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
    </div>
  )
}
