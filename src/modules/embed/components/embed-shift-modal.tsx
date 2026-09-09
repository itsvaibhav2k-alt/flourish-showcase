'use client'

import { useEffect, useCallback } from 'react'
import { Calendar, Clock, MapPin, Users, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type EmbedThemeConfig, getAccentButtonClasses } from '../utils/embed-themes'
import { type EmbedShift } from './embed-shift-card'

interface EmbedShiftModalProps {
  shift: EmbedShift
  orgSlug: string
  theme: EmbedThemeConfig
  themeName: 'light' | 'dark'
  hasAccent: boolean
  onClose: () => void
}

export function EmbedShiftModal({
  shift,
  orgSlug,
  theme,
  themeName,
  hasAccent,
  onClose,
}: EmbedShiftModalProps) {
  const startDate = new Date(shift.start_time)
  const endDate = new Date(shift.end_time)

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  // Status badge
  const getStatusBadge = () => {
    if (shift.is_full) {
      return (
        <span
          className={cn(
            'text-sm font-medium px-3 py-1 rounded-full',
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
            'text-sm font-medium px-3 py-1 rounded-full',
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
          'text-sm font-medium px-3 py-1 rounded-full',
          theme.statusOpen.bg,
          theme.statusOpen.text
        )}
      >
        Open
      </span>
    )
  }

  const signupUrl = `/public/shifts/${orgSlug}/${shift.id}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn('absolute inset-0', theme.overlayBg)}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-xl border shadow-xl',
          theme.bgPrimary,
          theme.border
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 p-1 rounded-md transition-colors',
            theme.textMuted,
            theme.bgHover
          )}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="pr-8">
            <div className="flex items-start gap-3">
              <h2
                id="modal-title"
                className={cn('text-xl font-semibold', theme.textPrimary)}
              >
                {shift.title}
              </h2>
            </div>
            <div className="mt-2">{getStatusBadge()}</div>
          </div>

          {/* Details */}
          <div className="mt-6 space-y-4">
            <div className={cn('flex items-start gap-3', theme.textSecondary)}>
              <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{dateStr}</span>
            </div>

            <div className={cn('flex items-start gap-3', theme.textSecondary)}>
              <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                {startTime} - {endTime}
              </span>
            </div>

            {shift.location && (
              <div className={cn('flex items-start gap-3', theme.textSecondary)}>
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{shift.location}</span>
              </div>
            )}

            <div className={cn('flex items-start gap-3', theme.textSecondary)}>
              <Users className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                {shift.capacity
                  ? `${shift.confirmed_signups} / ${shift.capacity} volunteers`
                  : `${shift.confirmed_signups} volunteer${
                      shift.confirmed_signups !== 1 ? 's' : ''
                    } signed up`}
              </span>
            </div>
          </div>

          {/* Description */}
          {shift.description && (
            <div className="mt-6">
              <h3 className={cn('text-sm font-medium mb-2', theme.textPrimary)}>
                Description
              </h3>
              <p className={cn('text-sm leading-relaxed', theme.textMuted)}>
                {shift.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                hasAccent
                  ? 'embed-accent-bg'
                  : themeName === 'dark'
                  ? 'bg-primary-500 hover:bg-primary-400'
                  : 'bg-primary-600 hover:bg-primary-700',
                getAccentButtonClasses(themeName, hasAccent),
                shift.is_full && 'opacity-50 pointer-events-none'
              )}
              aria-disabled={shift.is_full}
            >
              {shift.is_full ? (
                'Shift Full'
              ) : (
                <>
                  Sign Up
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </a>

            <button
              onClick={onClose}
              className={cn(
                'px-4 py-3 rounded-lg font-medium border transition-colors',
                theme.border,
                theme.textSecondary,
                theme.bgHover,
                theme.borderHover
              )}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
