/**
 * Activity Timeline Component
 *
 * Displays a timeline of activities for a contact
 */

import * as React from 'react'
import {
  DollarSign,
  Mail,
  UserPlus,
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { ContactActivity } from '../queries/get-contact-activities'

interface ActivityTimelineProps {
  activities: ContactActivity[]
  showEmpty?: boolean
}

/**
 * Get icon for activity type
 */
function getActivityIcon(activityType: string) {
  switch (activityType) {
    case 'gift_recorded':
    case 'gift_updated':
    case 'gift_deleted':
      return DollarSign
    case 'email_sent':
    case 'email_draft_created':
      return Mail
    case 'volunteer_signup':
      return Calendar
    case 'volunteer_checkin':
      return UserCheck
    case 'volunteer_no_show':
    case 'volunteer_cancelled':
      return XCircle
    case 'contact_created':
      return UserPlus
    case 'contact_updated':
      return Edit
    case 'shift_created':
    case 'shift_updated':
      return Calendar
    case 'note_added':
      return AlertCircle
    default:
      return CheckCircle2
  }
}

/**
 * Get color class for activity type
 */
function getActivityColors(activityType: string): { bg: string; icon: string; dot: string } {
  switch (activityType) {
    case 'gift_recorded':
    case 'gift_updated':
      return { bg: 'bg-green-50', icon: 'text-green-600', dot: 'bg-green-500' }
    case 'gift_deleted':
      return { bg: 'bg-red-50', icon: 'text-red-600', dot: 'bg-red-500' }
    case 'email_sent':
    case 'email_draft_created':
      return { bg: 'bg-blue-50', icon: 'text-blue-600', dot: 'bg-blue-500' }
    case 'volunteer_signup':
    case 'volunteer_checkin':
      return { bg: 'bg-violet-50', icon: 'text-violet-600', dot: 'bg-violet-500' }
    case 'volunteer_no_show':
    case 'volunteer_cancelled':
      return { bg: 'bg-orange-50', icon: 'text-orange-600', dot: 'bg-orange-500' }
    case 'contact_created':
      return { bg: 'bg-teal-50', icon: 'text-teal-600', dot: 'bg-teal-500' }
    case 'contact_updated':
      return { bg: 'bg-neutral-100', icon: 'text-neutral-600', dot: 'bg-neutral-500' }
    default:
      return { bg: 'bg-neutral-100', icon: 'text-neutral-600', dot: 'bg-neutral-400' }
  }
}

/**
 * Format activity type for display
 */
function formatActivityType(activityType: string): string {
  return activityType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format date relative to now
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Activity Timeline Component - Stripe-inspired design
 * Features: connected vertical line with dots, clean activity items, hover effects
 */
export function ActivityTimeline({ activities, showEmpty = true }: ActivityTimelineProps) {
  if (activities.length === 0 && !showEmpty) {
    return null
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
          <Clock className="h-6 w-6 text-neutral-400" />
        </div>
        <p className="text-sm font-medium text-neutral-600">No activity yet</p>
        <p className="text-xs text-neutral-400 mt-1">
          Activities will appear here as you interact with this contact
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Continuous vertical line - positioned behind dots */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" aria-hidden="true" />

      <div className="space-y-0">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.activity_type)
          const colors = getActivityColors(activity.activity_type)
          const isFirst = index === 0
          const isLast = index === activities.length - 1

          return (
            <div
              key={activity.id}
              className="relative flex gap-4 py-4 group hover:bg-neutral-50/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              {/* Timeline dot with ring */}
              <div className="relative z-10 flex items-center justify-center shrink-0">
                {/* White background to cover the line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 bg-white rounded-full" />
                </div>
                {/* The dot itself */}
                <div
                  className={`relative h-4 w-4 rounded-full border-2 bg-white ${colors.dot.replace('bg-', 'border-')} flex items-center justify-center`}
                >
                  {/* Inner dot for active/important items */}
                  {(activity.activity_type.includes('gift') || activity.activity_type.includes('checkin')) && (
                    <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  )}
                </div>
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header row with type and time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg}`}>
                        <Icon className={`h-3 w-3 ${colors.icon}`} />
                        <span className={colors.icon}>
                          {formatActivityType(activity.activity_type)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {formatRelativeDate(activity.created_at)}
                      </span>
                    </div>

                    {/* Description */}
                    {activity.description && (
                      <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {/* Metadata badges */}
                    {activity.metadata &&
                      typeof activity.metadata === 'object' &&
                      !Array.isArray(activity.metadata) && (
                        <div className="flex items-center gap-2 mt-2">
                          {'amount' in activity.metadata && activity.metadata.amount && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                              <DollarSign className="h-3 w-3" />
                              ${Number(activity.metadata.amount).toLocaleString()}
                            </span>
                          )}
                          {'hours_logged' in activity.metadata && activity.metadata.hours_logged && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700">
                              <Clock className="h-3 w-3" />
                              {String(activity.metadata.hours_logged)} hrs
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* End cap for the timeline */}
      <div className="absolute left-4 bottom-0 -translate-x-[3px] w-2 h-2 rounded-full bg-neutral-200" aria-hidden="true" />
    </div>
  )
}
