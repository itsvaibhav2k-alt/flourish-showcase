'use client'

/**
 * Copilot Action Card
 *
 * Displays a single AI-generated action suggestion with donor info and action buttons
 */

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  X,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  Heart,
  UserPlus,
} from 'lucide-react'
import {
  completeAction,
  dismissAction,
  snoozeAction,
} from '../actions/update-action-status'
import type { CopilotActionWithContact } from '../queries/get-copilot-actions'

interface CopilotActionCardProps {
  action: CopilotActionWithContact
  onActionUpdate?: () => void
  compact?: boolean
}

/**
 * Get icon for action type
 */
function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'reach_out':
      return <MessageSquare className="h-4 w-4" />
    case 'send_ask':
      return <TrendingUp className="h-4 w-4" />
    case 're_engage':
      return <UserPlus className="h-4 w-4" />
    case 'thank':
      return <Heart className="h-4 w-4" />
    case 'follow_up':
      return <Mail className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

/**
 * Get badge color for action type
 */
function getActionTypeColor(actionType: string) {
  switch (actionType) {
    case 'send_ask':
      return 'bg-neutral-100 text-neutral-800'
    case 're_engage':
      return 'bg-neutral-100 text-neutral-800'
    case 'thank':
      return 'bg-neutral-100 text-neutral-800'
    case 'reach_out':
      return 'bg-neutral-100 text-neutral-800'
    case 'follow_up':
      return 'bg-neutral-100 text-neutral-800'
    default:
      return 'bg-neutral-100 text-neutral-800'
  }
}

/**
 * Get priority badge color
 */
function getPriorityColor(priority: number) {
  if (priority >= 8) return 'bg-red-100 text-red-800'
  if (priority >= 5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

/**
 * Format priority label
 */
function getPriorityLabel(priority: number) {
  if (priority >= 8) return 'High Priority'
  if (priority >= 5) return 'Medium'
  return 'Low'
}

/**
 * Get channel icon
 */
function getChannelIcon(channel: string) {
  switch (channel) {
    case 'phone':
      return <Phone className="h-3 w-3" />
    case 'email':
      return <Mail className="h-3 w-3" />
    case 'in_person':
      return <MessageSquare className="h-3 w-3" />
    default:
      return <Mail className="h-3 w-3" />
  }
}

export function CopilotActionCard({
  action,
  onActionUpdate,
  compact = false,
}: CopilotActionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleComplete = async () => {
    setIsProcessing(true)
    try {
      const result = await completeAction(action.id)
      if (result.success) {
        onActionUpdate?.()
      } else {
        console.error('Failed to complete action:', result.error)
      }
    } catch (error) {
      console.error('Error completing action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = async () => {
    setIsProcessing(true)
    try {
      const result = await dismissAction(action.id)
      if (result.success) {
        onActionUpdate?.()
      } else {
        console.error('Failed to dismiss action:', result.error)
      }
    } catch (error) {
      console.error('Error dismissing action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSnooze = async () => {
    setIsProcessing(true)
    try {
      const result = await snoozeAction(action.id, 7)
      if (result.success) {
        onActionUpdate?.()
      } else {
        console.error('Failed to snooze action:', result.error)
      }
    } catch (error) {
      console.error('Error snoozing action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const contactName = `${action.contact.first_name} ${action.contact.last_name}`
  const lifetimeGiving = action.contact.lifetime_giving || 0

  return (
    <Card className={compact ? 'p-4' : 'p-6'}>
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded ${getActionTypeColor(action.action_type)}`}>
              {getActionIcon(action.action_type)}
            </div>
            <h3 className={compact ? 'font-semibold text-sm' : 'font-semibold text-base'}>
              {action.title}
            </h3>
          </div>

          {/* Donor info */}
          <div className="mb-3">
            <Link
              href={`/contacts/${action.contact_id}`}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              {contactName}
            </Link>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <span>${lifetimeGiving.toLocaleString()} lifetime</span>
              <span>"</span>
              <span>{action.contact.total_gifts} gifts</span>
              {action.context_snapshot?.lapseRisk && (
                <>
                  <span>"</span>
                  <Badge
                    className={`text-xs ${
                      action.context_snapshot.lapseRisk === 'high'
                        ? 'bg-red-100 text-red-800'
                        : action.context_snapshot.lapseRisk === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {action.context_snapshot.lapseRisk} risk
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <p className={compact ? 'text-sm text-gray-700 mb-3' : 'text-sm text-gray-700 mb-4'}>
            {action.description}
          </p>

          {/* AI Reasoning - only in full view */}
          {!compact && action.reasoning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-700">
                <span className="font-semibold text-blue-900">AI Insight: </span>
                {action.reasoning}
              </p>
            </div>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className={getPriorityColor(action.priority)}>
              {getPriorityLabel(action.priority)}
            </Badge>

            {action.predicted_success_rate && (
              <Badge className="bg-neutral-100 text-neutral-700 text-xs">
                {action.predicted_success_rate}% success rate
              </Badge>
            )}

            {action.predicted_gift_amount && (
              <Badge className="bg-neutral-100 text-neutral-700 text-xs">
                Est. ${action.predicted_gift_amount.toLocaleString()}
              </Badge>
            )}

            {action.preferred_channel && (
              <Badge className="bg-gray-100 text-gray-700 text-xs flex items-center gap-1">
                {getChannelIcon(action.preferred_channel)}
                {action.preferred_channel}
              </Badge>
            )}

            {action.optimal_timing && (
              <Badge className="bg-neutral-100 text-neutral-700 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {action.optimal_timing}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Complete
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSnooze}
              disabled={isProcessing}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Snooze
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-1.5" />
              Dismiss
            </Button>

            <Link href={`/contacts/${action.contact_id}`}>
              <Button size="sm" variant="outline">
                View Donor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
