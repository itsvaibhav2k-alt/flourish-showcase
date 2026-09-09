import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'

interface ShiftCardProps {
  shift: {
    id: string
    title: string
    start_time: string
    end_time: string
    location?: string | null
    capacity: number | null
    status: string
    confirmed_signups?: number
    total_signups?: number
    fill_rate?: number
  }
  isPast?: boolean
}

export function ShiftCard({ shift, isPast = false }: ShiftCardProps) {
  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNum = startDate.getDate()
  const monthName = startDate.toLocaleDateString('en-US', { month: 'short' })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const confirmedCount = shift.confirmed_signups || 0
  const capacity = shift.capacity
  const fillRate = capacity ? Math.round((confirmedCount / capacity) * 100) : 0
  const spotsLeft = capacity ? Math.max(0, capacity - confirmedCount) : null

  const statusConfig: Record<
    string,
    { label: string; dotColor: string; bgColor: string; textColor: string }
  > = {
    open: {
      label: 'Open',
      dotColor: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    full: {
      label: 'Full',
      dotColor: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    completed: {
      label: 'Completed',
      dotColor: 'bg-neutral-400',
      bgColor: 'bg-neutral-100',
      textColor: 'text-neutral-600',
    },
    cancelled: {
      label: 'Cancelled',
      dotColor: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  }

  const status = statusConfig[shift.status] || statusConfig.open

  // Progress bar color based on fill rate
  const getProgressColor = () => {
    if (fillRate >= 100) return 'bg-blue-500'
    if (fillRate >= 75) return 'bg-green-500'
    if (fillRate >= 50) return 'bg-amber-500'
    return 'bg-violet-500'
  }

  return (
    <Link
      href={`/volunteers/shifts/${shift.id}`}
      className={cn(
        'group block rounded-xl border border-neutral-200/80 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-md',
        isPast && 'opacity-75 hover:opacity-100'
      )}
    >
      <div className="flex gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'h-14 w-14 rounded-xl flex flex-col items-center justify-center',
              isPast ? 'bg-neutral-100' : 'bg-violet-50'
            )}
          >
            <span
              className={cn(
                'text-[10px] font-medium uppercase',
                isPast ? 'text-neutral-500' : 'text-violet-600'
              )}
            >
              {monthName}
            </span>
            <span
              className={cn(
                'text-xl font-bold leading-none',
                isPast ? 'text-neutral-700' : 'text-violet-700'
              )}
            >
              {dayNum}
            </span>
            <span
              className={cn(
                'text-[10px] font-medium',
                isPast ? 'text-neutral-400' : 'text-violet-500'
              )}
            >
              {dayName}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900 truncate group-hover:text-violet-700 transition-colors">
              {shift.title}
            </h3>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                status.bgColor,
                status.textColor
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dotColor)} />
              {status.label}
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {startTime} - {endTime}
              </span>
            </div>
            {shift.location && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{shift.location}</span>
              </div>
            )}
          </div>

          {/* Capacity Bar */}
          {capacity && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-500">
                    <Users className="h-3 w-3 inline mr-1" />
                    {confirmedCount} / {capacity} volunteers
                  </span>
                  <ScoreInfoButton
                    scoreKey="shiftFillRate"
                    value={fillRate}
                    size="sm"
                    scoreDefinitions={scoreDefinitions}
                  />
                </div>
                {spotsLeft !== null && spotsLeft > 0 && !isPast && (
                  <span className="text-amber-600 font-medium">
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                  </span>
                )}
                {spotsLeft === 0 && !isPast && (
                  <span className="text-blue-600 font-medium">Full</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    getProgressColor()
                  )}
                  style={{ width: `${Math.min(100, fillRate)}%` }}
                />
              </div>
            </div>
          )}

          {!capacity && (
            <div className="mt-3 flex items-center text-xs text-neutral-500">
              <Users className="h-3 w-3 mr-1" />
              {confirmedCount} volunteer{confirmedCount !== 1 ? 's' : ''} signed up
              <span className="text-neutral-400 ml-1">(unlimited)</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center">
          <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-violet-400 transition-colors" />
        </div>
      </div>
    </Link>
  )
}
