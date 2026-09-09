import * as React from 'react'
import {
  Phone,
  Users,
  Mail,
  Calendar,
  MapPin,
  Coffee,
  Gift,
  FileText,
  MoreHorizontal,
} from 'lucide-react'
import type { CultivationMove } from '../queries/get-prospect'

interface MoveTimelineProps {
  moves: CultivationMove[]
}

const moveTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  event: Calendar,
  tour: MapPin,
  lunch: Coffee,
  gift: Gift,
  proposal: FileText,
  other: MoreHorizontal,
}

const moveTypeColors: Record<string, { bg: string; icon: string }> = {
  call: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  meeting: { bg: 'bg-violet-50', icon: 'text-violet-600' },
  email: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  event: { bg: 'bg-green-50', icon: 'text-green-600' },
  tour: { bg: 'bg-rose-50', icon: 'text-rose-600' },
  lunch: { bg: 'bg-orange-50', icon: 'text-orange-600' },
  gift: { bg: 'bg-pink-50', icon: 'text-pink-600' },
  proposal: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  other: { bg: 'bg-neutral-50', icon: 'text-neutral-600' },
}

export function MoveTimeline({ moves }: MoveTimelineProps) {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (moves.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-xl bg-neutral-50 flex items-center justify-center mx-auto mb-3">
          <Calendar className="h-6 w-6 text-neutral-300" />
        </div>
        <p className="text-sm text-neutral-500 mb-1">No cultivation moves yet</p>
        <p className="text-xs text-neutral-400">
          Start logging interactions to track your cultivation efforts
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {moves.map((move, index) => {
        const Icon = moveTypeIcons[move.move_type] || MoreHorizontal
        const colors = moveTypeColors[move.move_type] || {
          bg: 'bg-neutral-50',
          icon: 'text-neutral-600',
        }
        const isLast = index === moves.length - 1

        return (
          <div key={move.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-px bg-neutral-200" />
            )}

            {/* Move card */}
            <div className="flex gap-4">
              {/* Icon */}
              <div
                className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 z-10`}
              >
                <Icon className={`h-5 w-5 ${colors.icon}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-neutral-900">
                    {capitalize(move.move_type)}
                  </h4>
                  <span className="text-xs text-neutral-500">
                    {formatDate(move.move_date)}
                  </span>
                </div>

                {move.description && (
                  <p className="text-sm text-neutral-600 mb-2">
                    {move.description}
                  </p>
                )}

                {move.outcome && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-neutral-500">
                      Outcome:{' '}
                    </span>
                    <span className="text-xs text-neutral-700">
                      {move.outcome}
                    </span>
                  </div>
                )}

                {move.next_step && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-neutral-500">
                      Next Step:{' '}
                    </span>
                    <span className="text-xs text-neutral-700">
                      {move.next_step}
                    </span>
                  </div>
                )}

                {move.logged_by_user && (
                  <p className="text-xs text-neutral-400">
                    Logged by {move.logged_by_user.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
