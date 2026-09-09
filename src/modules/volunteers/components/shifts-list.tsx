import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { ShiftCard } from './shift-card'
import { Button } from '@/components/ui/button'

interface ShiftsListProps {
  shifts: Array<{
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
  }>
  emptyMessage?: string
  isPast?: boolean
}

export function ShiftsList({
  shifts,
  emptyMessage = 'No shifts found',
  isPast = false,
}: ShiftsListProps) {
  if (shifts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-6 w-6 text-violet-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">
          {isPast ? 'No past shifts' : 'No upcoming shifts'}
        </p>
        <p className="text-xs text-neutral-400 mt-1 mb-4">{emptyMessage}</p>
        {!isPast && (
          <Button
            asChild
            size="sm"
            className="bg-violet-500 hover:bg-violet-600 text-white shadow-sm"
          >
            <Link href="/volunteers/shifts/new">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Shift
            </Link>
          </Button>
        )}
      </div>
    )
  }

  // Group shifts by date
  const groupedShifts = shifts.reduce(
    (groups, shift) => {
      const date = new Date(shift.start_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(shift)
      return groups
    },
    {} as Record<string, typeof shifts>
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedShifts).map(([date, dateShifts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-medium text-neutral-700">{date}</h3>
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">
              {dateShifts.length} shift{dateShifts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {dateShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} isPast={isPast} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
