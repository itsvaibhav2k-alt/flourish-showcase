'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type EmbedTheme,
  getThemeConfig,
  getAccentStyles,
  accentColorStyles,
} from '../utils/embed-themes'
import { EmbedMonthView } from './embed-month-view'
import { EmbedWeekView } from './embed-week-view'
import { EmbedShiftModal } from './embed-shift-modal'
import { type EmbedShift } from './embed-shift-card'

export type CalendarView = 'month' | 'week'

export interface EmbedCalendarProps {
  shifts: EmbedShift[]
  orgSlug: string
  orgName: string
  // Configuration options
  initialView?: CalendarView
  theme?: EmbedTheme
  accentColor?: string
  hideHeader?: boolean
  compact?: boolean
}

export function EmbedCalendar({
  shifts,
  orgSlug,
  orgName,
  initialView = 'month',
  theme: themeName = 'light',
  accentColor,
  hideHeader = false,
  compact = false,
}: EmbedCalendarProps) {
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState<EmbedShift | null>(null)

  const theme = getThemeConfig(themeName)
  const accentStyles = getAccentStyles(accentColor)
  const hasAccent = Boolean(accentColor)

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Format current date for display
  const dateLabel = useMemo(() => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const year = startOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`
      }
      return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`
    }
  }, [currentDate, view])

  const handleShiftClick = (shift: EmbedShift) => {
    setSelectedShift(shift)
  }

  const closeModal = () => {
    setSelectedShift(null)
  }

  return (
    <div
      className={cn('w-full', theme.bgPrimary, theme.textPrimary)}
      style={accentStyles}
    >
      {/* Inject accent color styles */}
      <style dangerouslySetInnerHTML={{ __html: accentColorStyles }} />

      {/* Header */}
      {!hideHeader && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b',
            theme.border
          )}
        >
          <div>
            <h2 className={cn('text-lg font-semibold', theme.textPrimary)}>
              {orgName}
            </h2>
            <p className={cn('text-sm', theme.textMuted)}>
              Volunteer Opportunities
            </p>
          </div>

          {/* View toggle */}
          <div
            className={cn(
              'flex items-center gap-1 p-1 rounded-lg',
              theme.bgSecondary
            )}
          >
            <button
              onClick={() => setView('month')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === 'month'
                  ? cn(
                      hasAccent ? 'embed-accent-bg text-white' : 'bg-white shadow-sm',
                      theme.textPrimary
                    )
                  : theme.textMuted
              )}
            >
              <Calendar className="h-4 w-4" />
              {!compact && <span>Month</span>}
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === 'week'
                  ? cn(
                      hasAccent ? 'embed-accent-bg text-white' : 'bg-white shadow-sm',
                      theme.textPrimary
                    )
                  : theme.textMuted
              )}
            >
              <List className="h-4 w-4" />
              {!compact && <span>Week</span>}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              theme.border,
              theme.bgHover,
              theme.borderHover
            )}
            aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
          >
            <ChevronLeft className={cn('h-4 w-4', theme.textSecondary)} />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              theme.border,
              theme.bgHover,
              theme.borderHover
            )}
            aria-label={view === 'month' ? 'Next month' : 'Next week'}
          >
            <ChevronRight className={cn('h-4 w-4', theme.textSecondary)} />
          </button>
          <button
            onClick={goToToday}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
              theme.border,
              theme.textSecondary,
              theme.bgHover,
              theme.borderHover
            )}
          >
            Today
          </button>
        </div>

        <h3 className={cn('text-base font-semibold', theme.textPrimary)}>
          {dateLabel}
        </h3>
      </div>

      {/* Calendar view */}
      {view === 'month' ? (
        <EmbedMonthView
          shifts={shifts}
          currentDate={currentDate}
          theme={theme}
          compact={compact}
          onShiftClick={handleShiftClick}
        />
      ) : (
        <EmbedWeekView
          shifts={shifts}
          currentDate={currentDate}
          theme={theme}
          compact={compact}
          onShiftClick={handleShiftClick}
        />
      )}

      {/* Empty state */}
      {shifts.length === 0 && (
        <div className={cn('text-center py-12', theme.textMuted)}>
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No upcoming shifts</p>
          <p className="text-sm mt-1">Check back soon for volunteer opportunities.</p>
        </div>
      )}

      {/* Shift detail modal */}
      {selectedShift && (
        <EmbedShiftModal
          shift={selectedShift}
          orgSlug={orgSlug}
          theme={theme}
          themeName={themeName}
          hasAccent={hasAccent}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
