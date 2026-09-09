'use client'

import { Clock, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type EmbedThemeConfig } from '../utils/embed-themes'

export interface EmbedShift {
  id: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
  capacity: number | null
  confirmed_signups: number
  available_spots: number | null
  is_full: boolean
}

interface EmbedShiftCardProps {
  shift: EmbedShift
  theme: EmbedThemeConfig
  compact?: boolean
  onClick?: () => void
}

export function EmbedShiftCard({
  shift,
  theme,
  compact = false,
  onClick,
}: EmbedShiftCardProps) {
  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`

  // Status badge
  const getStatusBadge = () => {
    if (shift.is_full) {
      return (
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            theme.statusFull.bg,
            theme.statusFull.text
          )}
        >
          Full
        </span>
      )
    }
    if (shift.available_spots !== null && shift.available_spots <= 3) {
      return (
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            theme.statusLow.bg,
            theme.statusLow.text
          )}
        >
          {shift.available_spots} spot{shift.available_spots !== 1 ? 's' : ''} left
        </span>
      )
    }
    return (
      <span
        className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          theme.statusOpen.bg,
          theme.statusOpen.text
        )}
      >
        Open
      </span>
    )
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-2 rounded-md border transition-smooth',
          theme.bgCard,
          theme.border,
          theme.bgCardHover,
          theme.borderHover,
          'cursor-pointer'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm font-medium truncate', theme.textPrimary)}>
            {shift.title}
          </span>
          {getStatusBadge()}
        </div>
        <div className={cn('text-xs mt-1', theme.textMuted)}>
          {timeStr}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-smooth',
        theme.bgCard,
        theme.border,
        theme.bgCardHover,
        theme.borderHover,
        'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn('font-semibold', theme.textPrimary)}>{shift.title}</h3>
        {getStatusBadge()}
      </div>

      <div className="mt-3 space-y-2">
        <div className={cn('flex items-center gap-2 text-sm', theme.textSecondary)}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{timeStr}</span>
        </div>

        {shift.location && (
          <div className={cn('flex items-center gap-2 text-sm', theme.textSecondary)}>
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{shift.location}</span>
          </div>
        )}

        <div className={cn('flex items-center gap-2 text-sm', theme.textMuted)}>
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            {shift.capacity
              ? `${shift.confirmed_signups}/${shift.capacity} volunteers`
              : `${shift.confirmed_signups} signed up`}
          </span>
        </div>
      </div>

      {shift.description && (
        <p className={cn('mt-3 text-sm line-clamp-2', theme.textMuted)}>
          {shift.description}
        </p>
      )}
    </button>
  )
}
