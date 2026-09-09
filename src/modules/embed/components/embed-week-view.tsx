'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { type EmbedThemeConfig } from '../utils/embed-themes'
import { EmbedShiftCard, type EmbedShift } from './embed-shift-card'

interface EmbedWeekViewProps {
  shifts: EmbedShift[]
  currentDate: Date
  theme: EmbedThemeConfig
  compact?: boolean
  onShiftClick: (shift: EmbedShift) => void
}

interface DayGroup {
  date: Date
  dateStr: string
  dayName: string
  isToday: boolean
  shifts: EmbedShift[]
}

export function EmbedWeekView({
  shifts,
  currentDate,
  theme,
  compact = false,
  onShiftClick,
}: EmbedWeekViewProps) {
  // Generate days for the current week
  const weekDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const days: DayGroup[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // Find shifts for this day
      const dayShifts = shifts.filter((shift) => {
        const shiftStart = new Date(shift.start_time)
        return shiftStart >= dayStart && shiftStart <= dayEnd
      })

      days.push({
        date,
        dateStr: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: date.getTime() === today.getTime(),
        shifts: dayShifts,
      })
    }

    return days
  }, [currentDate, shifts])

  // Check if there are any shifts this week
  const hasShifts = weekDays.some((day) => day.shifts.length > 0)

  if (!hasShifts) {
    return (
      <div className={cn('text-center py-12', theme.textMuted)}>
        <p>No volunteer shifts scheduled this week.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {weekDays.map((day) => {
        if (day.shifts.length === 0) return null

        return (
          <div key={day.date.toISOString()}>
            {/* Day header */}
            <div
              className={cn(
                'flex items-center gap-2 mb-2',
                day.isToday && 'embed-accent-text'
              )}
            >
              <span
                className={cn(
                  'text-sm font-semibold',
                  day.isToday ? 'embed-accent-text' : theme.textPrimary
                )}
              >
                {day.dayName}
              </span>
              <span
                className={cn(
                  'text-sm',
                  day.isToday ? 'embed-accent-text' : theme.textMuted
                )}
              >
                {day.dateStr}
              </span>
              {day.isToday && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full embed-accent-bg text-white'
                  )}
                >
                  Today
                </span>
              )}
            </div>

            {/* Shifts for this day */}
            <div className={cn('space-y-2', compact && 'space-y-1')}>
              {day.shifts.map((shift) => (
                <EmbedShiftCard
                  key={shift.id}
                  shift={shift}
                  theme={theme}
                  compact={compact}
                  onClick={() => onShiftClick(shift)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
