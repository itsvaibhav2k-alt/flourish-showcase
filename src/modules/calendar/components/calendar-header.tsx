'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CalendarViewMode } from '../types/calendar.types'
import { formatWeekRange, formatMonthYear } from '../utils/calendar-utils'

interface CalendarHeaderProps {
  currentDate: Date
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  isLoading?: boolean
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  isLoading = false,
}: CalendarHeaderProps) {
  const dateLabel =
    viewMode === 'week'
      ? formatWeekRange(currentDate)
      : formatMonthYear(currentDate)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/60">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="rounded-r-none border-r-0"
            onClick={() => onNavigate('prev')}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none"
            onClick={() => onNavigate('next')}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          disabled={isLoading}
          className="ml-2"
        >
          Today
        </Button>
      </div>

      {/* Center: Date label */}
      <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-violet-500" />
        {dateLabel}
        {isLoading && (
          <span className="text-sm font-normal text-neutral-400 animate-pulse">
            Loading...
          </span>
        )}
      </h2>

      {/* Right: View toggle */}
      <Tabs
        value={viewMode}
        onValueChange={(value) => onViewModeChange(value as CalendarViewMode)}
      >
        <TabsList className="bg-neutral-100/50">
          <TabsTrigger value="week" className="data-[state=active]:bg-white">
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-white">
            Month
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
