'use client'

import { TodayAction } from '@/modules/dashboard/queries/get-todays-actions'
import { dismissAction } from '@/modules/dashboard/actions/dismiss-action'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, DollarSign, Mail, AlertCircle, CheckCircle, ChevronRight, X, Users, Cake } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface TodaysActionsProps {
  initialActions: TodayAction[]
  hasContacts: boolean
}

/**
 * Today's Actions widget for the dashboard
 * Displays prioritized action items that need attention
 */
export function TodaysActions({ initialActions, hasContacts }: TodaysActionsProps) {
  const [actions, setActions] = useState<TodayAction[]>(initialActions)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDismiss = async (actionId: string) => {
    // Optimistic update
    setActions(prev => prev.filter(action => action.id !== actionId))

    startTransition(async () => {
      const result = await dismissAction(actionId)

      if (result.success) {
        toast.success('Action dismissed')
        router.refresh()
      } else {
        // Revert optimistic update on error
        setActions(initialActions)
        toast.error(result.error || 'Failed to dismiss action')
      }
    })
  }

  // Enhanced action descriptions for clarity
  const getEnhancedDescription = (action: TodayAction): string => {
    switch (action.type) {
      case 'lapsing_donor':
        return `Re-engage this donor who hasn't given in ${action.metadata.daysSinceLastGift} days. Lifetime giving: $${(action.metadata.lifetimeGiving || 0).toLocaleString()}`
      case 'pending_email':
        return 'Review and approve AI-generated emails before sending to contacts'
      case 'understaffed_shift':
        return `Only ${action.metadata.fillRate}% filled. Recruit ${action.metadata.capacity - action.metadata.confirmedCount} more volunteers`
      case 'top_volunteer':
        return `Send recognition for ${action.metadata.totalHours} volunteer hours contributed`
      case 'birthday':
        return `Send birthday wishes ${action.metadata.daysUntilBirthday === 0 ? 'today' : action.metadata.daysUntilBirthday === 1 ? 'tomorrow' : `in ${action.metadata.daysUntilBirthday} days`}`
      default:
        return action.description
    }
  }

  // Map action types to icons and styles
  const getActionIcon = (type: TodayAction['type']) => {
    switch (type) {
      case 'understaffed_shift':
        return Calendar
      case 'lapsing_donor':
        return DollarSign
      case 'pending_email':
        return Mail
      case 'top_volunteer':
        return Users
      case 'birthday':
        return Cake
      default:
        return AlertCircle
    }
  }

  const getPriorityColor = (priority: TodayAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500'
      case 'medium':
        return 'bg-amber-500'
      case 'low':
        return 'bg-neutral-400'
      default:
        return 'bg-neutral-400'
    }
  }

  const getIconBg = (type: TodayAction['type']) => {
    switch (type) {
      case 'understaffed_shift':
        return 'bg-teal-50'
      case 'lapsing_donor':
        return 'bg-rose-50'
      case 'pending_email':
        return 'bg-violet-50'
      case 'top_volunteer':
        return 'bg-emerald-50'
      case 'birthday':
        return 'bg-pink-50'
      default:
        return 'bg-neutral-50'
    }
  }

  const getIconColor = (type: TodayAction['type']) => {
    switch (type) {
      case 'understaffed_shift':
        return 'text-teal-600'
      case 'lapsing_donor':
        return 'text-rose-500'
      case 'pending_email':
        return 'text-violet-600'
      case 'top_volunteer':
        return 'text-emerald-600'
      case 'birthday':
        return 'text-pink-600'
      default:
        return 'text-neutral-600'
    }
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-neutral-900">Today&apos;s Actions</CardTitle>
          {actions.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
              {actions.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {actions.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {actions.map((action) => {
              const Icon = getActionIcon(action.type)
              const iconBg = getIconBg(action.type)
              const iconColor = getIconColor(action.type)
              const priorityColor = getPriorityColor(action.priority)

              return (
                <div
                  key={action.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-neutral-50/50 transition-fast group relative"
                >
                  {/* Priority indicator dot */}
                  <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${priorityColor}`} />

                  {/* Icon */}
                  <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 mb-0.5">{action.title}</h4>
                    <p className="text-xs text-neutral-500 line-clamp-2">{getEnhancedDescription(action)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Dismiss button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(action.id)}
                      disabled={isPending}
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {/* Action button */}
                    <Link href={action.actionUrl} className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {action.actionLabel}
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center px-5">
            {hasContacts ? (
              <>
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium text-neutral-600">You&apos;re all caught up!</p>
                <p className="text-xs text-neutral-400 mt-1">No urgent actions at this time</p>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600">Add your first contact to get started</p>
                <p className="text-xs text-neutral-400 mt-1">Actions will appear here once you have contacts</p>
                <Link href="/contacts/new" className="mt-4 inline-block">
                  <Button size="sm" variant="outline">
                    Add Contact
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
