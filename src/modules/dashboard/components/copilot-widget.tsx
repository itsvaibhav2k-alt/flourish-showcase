'use client'

import { CopilotActionWithContact } from '@/modules/copilot/queries/get-copilot-actions'
import { completeAction } from '@/modules/copilot/actions/complete-action'
import { dismissAction } from '@/modules/copilot/actions/dismiss-action'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Heart,
  DollarSign,
  Mail,
  Phone,
  MessageCircle,
  UserPlus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  TrendingUp,
  Award,
  Target,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CopilotWidgetProps {
  initialActions: CopilotActionWithContact[]
}

/**
 * AI Fundraising Copilot Widget
 *
 * The "wow" feature - displays AI-generated fundraising action suggestions
 * with beautiful animations and detailed reasoning.
 */
export function CopilotWidget({ initialActions }: CopilotWidgetProps) {
  const [actions, setActions] = useState<CopilotActionWithContact[]>(initialActions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()

  const handleComplete = async (actionId: string) => {
    setCompletingId(actionId)

    // Optimistic update with animation
    setActions(prev => prev.filter(action => action.id !== actionId))

    startTransition(async () => {
      const result = await completeAction({ actionId })

      if (result.success) {
        toast.success('Action completed! Great work.')
        router.refresh()
      } else {
        // Revert optimistic update on error
        setActions(initialActions)
        toast.error(result.error || 'Failed to complete action')
      }
      setCompletingId(null)
    })
  }

  const handleDismiss = async (actionId: string) => {
    // Optimistic update
    setActions(prev => prev.filter(action => action.id !== actionId))

    startTransition(async () => {
      const result = await dismissAction({ actionId })

      if (result.success) {
        toast('Action dismissed')
        router.refresh()
      } else {
        // Revert optimistic update on error
        setActions(initialActions)
        toast.error(result.error || 'Failed to dismiss action')
      }
    })
  }

  const toggleExpanded = (actionId: string) => {
    setExpandedId(expandedId === actionId ? null : actionId)
  }

  // Map action types to icons and colors
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_ask':
        return DollarSign
      case 're_engage':
        return MessageCircle
      case 'thank':
        return Heart
      case 'follow_up':
        return Phone
      case 'reach_out':
        return UserPlus
      default:
        return Mail
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'send_ask':
        return {
          bg: 'bg-emerald-50',
          icon: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-700',
        }
      case 're_engage':
        return {
          bg: 'bg-amber-50',
          icon: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700',
        }
      case 'thank':
        return {
          bg: 'bg-pink-50',
          icon: 'text-pink-600',
          badge: 'bg-pink-100 text-pink-700',
        }
      case 'follow_up':
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
        }
      case 'reach_out':
        return {
          bg: 'bg-violet-50',
          icon: 'text-violet-600',
          badge: 'bg-violet-100 text-violet-700',
        }
      default:
        return {
          bg: 'bg-neutral-50',
          icon: 'text-neutral-600',
          badge: 'bg-neutral-100 text-neutral-700',
        }
    }
  }

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'send_ask':
        return 'Ask'
      case 're_engage':
        return 'Re-engage'
      case 'thank':
        return 'Thank'
      case 'follow_up':
        return 'Follow Up'
      case 'reach_out':
        return 'Reach Out'
      default:
        return 'Action'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'phone':
        return Phone
      case 'mail':
        return Mail
      case 'in_person':
        return MessageCircle
      default:
        return Mail
    }
  }

  const getPriorityGradient = (priority: number) => {
    if (priority >= 80) return 'from-rose-500 to-orange-500'
    if (priority >= 60) return 'from-amber-500 to-yellow-500'
    return 'from-blue-500 to-cyan-500'
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-gradient-to-br from-white to-primary-50/30 overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/40 to-transparent rounded-full blur-3xl -z-10" />

      <CardHeader className="pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-neutral-900">
                AI Fundraising Copilot
              </CardTitle>
              <p className="text-xs text-neutral-500 mt-0.5">
                Smart action suggestions powered by Flora
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions.length > 0 && (
              <>
                <span className="text-xs text-neutral-500">
                  {actions.length} {actions.length === 1 ? 'action' : 'actions'}
                </span>
                <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-600"
              title={isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'}
            >
              {isCollapsed ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`p-0 transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
        {actions.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {actions.map((action, index) => {
              const Icon = getActionIcon(action.action_type)
              const colors = getActionColor(action.action_type)
              const ChannelIcon = getChannelIcon(action.preferred_channel)
              const isExpanded = expandedId === action.id
              const priorityGradient = getPriorityGradient(action.priority)

              return (
                <div
                  key={action.id}
                  className="relative animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                    {/* Priority indicator bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${priorityGradient}`}
                      style={{ opacity: action.priority / 100 }}
                    />

                    <div className="px-5 py-4 hover:bg-neutral-50/50 transition-fast">
                      {/* Main action content */}
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <Icon className={`h-5 w-5 ${colors.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-neutral-900">
                                  {action.contact.first_name} {action.contact.last_name}
                                </h4>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}
                                >
                                  {getActionLabel(action.action_type)}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-700 font-medium">
                                {action.title}
                              </p>
                            </div>

                            {/* Priority badge */}
                            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-neutral-200 shadow-sm">
                              <Target className="h-3 w-3 text-neutral-500" />
                              <span className="text-xs font-semibold text-neutral-700">
                                {action.priority}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-neutral-600 mb-2">
                            {action.description}
                          </p>

                          {/* Metadata tags */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Donor score */}
                            <div className="flex items-center gap-1 text-neutral-500">
                              <TrendingUp className="h-3 w-3" />
                              <span>Score: {action.donor_score}/100</span>
                            </div>

                            {/* Success rate */}
                            {action.predicted_success_rate > 0 && (
                              <div className="flex items-center gap-1 text-neutral-500">
                                <Award className="h-3 w-3" />
                                <span>{action.predicted_success_rate}% likely</span>
                              </div>
                            )}

                            {/* Predicted amount */}
                            {action.predicted_gift_amount && (
                              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                <DollarSign className="h-3 w-3" />
                                <span>${action.predicted_gift_amount.toLocaleString()}</span>
                              </div>
                            )}

                            {/* Channel */}
                            <div className="flex items-center gap-1 text-neutral-500">
                              <ChannelIcon className="h-3 w-3" />
                              <span className="capitalize">{action.preferred_channel}</span>
                            </div>

                            {/* Timing */}
                            <div className="text-neutral-500">
                              {action.optimal_timing}
                            </div>
                          </div>

                          {/* Expandable reasoning */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="mt-3 pt-3 border-t border-neutral-100">
                              <div className="flex items-start gap-2 bg-primary-50/50 rounded-lg p-3">
                                <Sparkles className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-primary-900 mb-1">
                                    Flora&apos;s Reasoning:
                                  </p>
                                  <p className="text-xs text-neutral-700 leading-relaxed">
                                    {action.reasoning}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleComplete(action.id)}
                              disabled={isPending || completingId === action.id}
                              className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Complete
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleExpanded(action.id)}
                              className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                                  Why?
                                </>
                              )}
                            </Button>

                            <Link
                              href={`/contacts/${action.contact_id}`}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-neutral-600 hover:text-neutral-900"
                              >
                                View Contact
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismiss(action.id)}
                              disabled={isPending}
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center px-5 animate-in fade-in zoom-in-95">
              <div className="relative inline-block mb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center mx-auto border border-green-100 shadow-sm">
                  <Check className="h-7 w-7 text-green-500" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-5 w-5 text-primary-500 animate-pulse" />
                </div>
              </div>
              <p className="text-base font-semibold text-neutral-900 mb-1">
                Inbox Zero!
              </p>
              <p className="text-sm text-neutral-500 mb-4">
                You&apos;ve completed all suggested actions. New recommendations will appear tomorrow at 6 AM.
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-neutral-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                <span>Powered by Claude AI</span>
              </div>
            </div>
          )
        }
      </CardContent>
    </Card>
  )
}
