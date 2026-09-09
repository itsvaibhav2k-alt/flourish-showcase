'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { type EmbedThemeConfig } from '../utils/embed-themes'
import { EmbedShiftCard, type EmbedShift } from './embed-shift-card'

interface EmbedMonthViewProps {
  shifts: EmbedShift[]
  currentDate: Date
  theme: EmbedThemeConfig
  compact?: boolean
  onShiftClick: (shift: EmbedShift) => void
}

interface DayCell {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  shifts: EmbedShift[]
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function EmbedMonthView({
  shifts,
  currentDate,
  theme,
  compact = false,
  onShiftClick,
}: EmbedMonthViewProps) {
  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Start from the Sunday before (or on) the first day
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // End on the Saturday after (or on) the last day
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days: DayCell[] = []
    const currentDateIter = new Date(startDate)

    while (currentDateIter <= endDate) {
      const dayStart = new Date(currentDateIter)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDateIter)
      dayEnd.setHours(23, 59, 59, 999)

      // Find shifts for this day
      const dayShifts = shifts.filter((shift) => {
        const shiftStart = new Date(shift.start_time)
        return shiftStart >= dayStart && shiftStart <= dayEnd
      })

      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.getTime() === today.getTime(),
        shifts: dayShifts,
      })

      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }

    return days
  }, [currentDate, shifts])

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: DayCell[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  return (
    <div className="w-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-medium py-2',
              theme.textMuted
            )}
          >
            {compact ? day.charAt(0) : day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={cn('border rounded-lg overflow-hidden', theme.border)}>
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className={cn('grid grid-cols-7 gap-px', theme.bgSecondary)}
          >
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={cn(
                  'min-h-[80px] p-1',
                  theme.bgPrimary,
                  !day.isCurrentMonth && 'opacity-40',
                  compact && 'min-h-[60px]'
                )}
              >
                {/* Day number */}
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    day.isToday
                      ? 'embed-accent-text font-bold'
                      : theme.textSecondary
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full',
                      day.isToday && 'embed-accent-bg text-white'
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                </div>

                {/* Shifts */}
                <div className={cn('space-y-1', compact && 'space-y-0.5')}>
                  {day.shifts.slice(0, compact ? 2 : 3).map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => onShiftClick(shift)}
                      className={cn(
                        'w-full text-left text-xs p-1 rounded truncate transition-colors',
                        shift.is_full
                          ? cn(theme.statusFull.bg, theme.statusFull.text)
                          : 'embed-accent-bg-light embed-accent-text',
                        'hover:opacity-80 cursor-pointer'
                      )}
                    >
                      {shift.title}
                    </button>
                  ))}
                  {day.shifts.length > (compact ? 2 : 3) && (
                    <button
                      onClick={() => onShiftClick(day.shifts[0])}
                      className={cn(
                        'w-full text-xs p-1 rounded text-center',
                        theme.textMuted,
                        theme.bgHover,
                        'cursor-pointer'
                      )}
                    >
                      +{day.shifts.length - (compact ? 2 : 3)} more
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
