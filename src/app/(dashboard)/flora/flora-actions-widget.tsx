'use client'

import { CopilotActionWithContact } from '@/modules/copilot/queries/get-copilot-actions'
import { completeAction } from '@/modules/copilot/actions/complete-action'
import { dismissAction } from '@/modules/copilot/actions/dismiss-action'
import { generateSuggestions } from '@/modules/copilot/actions/generate-suggestions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  DollarSign,
  Mail,
  Phone,
  MessageCircle,
  UserPlus,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FloraActionsWidgetProps {
  initialActions: CopilotActionWithContact[]
}

/**
 * Flora's Smart Suggestions Widget
 *
 * Displays AI-generated fundraising action suggestions with Flora branding
 */
export function FloraActionsWidget({ initialActions }: FloraActionsWidgetProps) {
  const [actions, setActions] = useState<CopilotActionWithContact[]>(initialActions)
  const [isPending, startTransition] = useTransition()
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsGenerating(true)
    toast.loading('Flora is analyzing your donors...', { id: 'generating' })

    try {
      const result = await generateSuggestions()

      if (result.success && result.actionsCreated > 0) {
        toast.success(`Flora generated ${result.actionsCreated} smart suggestions!`, { id: 'generating' })
        router.refresh()
      } else if (result.error) {
        toast.error(result.error, { id: 'generating' })
      } else {
        toast.info('No new suggestions to generate right now.', { id: 'generating' })
      }
    } catch {
      toast.error('Failed to generate suggestions. Please try again.', { id: 'generating' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleComplete = async (actionId: string) => {
    setCompletingId(actionId)
    setActions(prev => prev.filter(action => action.id !== actionId))

    startTransition(async () => {
      const result = await completeAction({ actionId })

      if (result.success) {
        toast.success('Nice work! Flora marked this as complete.')
        router.refresh()
      } else {
        setActions(initialActions)
        toast.error(result.error || 'Failed to complete action')
      }
      setCompletingId(null)
    })
  }

  const handleDismiss = async (actionId: string) => {
    setActions(prev => prev.filter(action => action.id !== actionId))

    startTransition(async () => {
      const result = await dismissAction({ actionId })

      if (result.success) {
        toast('Action dismissed')
        router.refresh()
      } else {
        setActions(initialActions)
        toast.error(result.error || 'Failed to dismiss action')
      }
    })
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_ask': return DollarSign
      case 're_engage': return MessageCircle
      case 'thank': return Heart
      case 'follow_up': return Phone
      case 'reach_out': return UserPlus
      default: return Mail
    }
  }

  const getIconColor = (actionType: string) => {
    switch (actionType) {
      case 'send_ask': return 'bg-emerald-100 text-emerald-600'
      case 're_engage': return 'bg-amber-100 text-amber-600'
      case 'thank': return 'bg-pink-100 text-pink-600'
      case 'follow_up': return 'bg-blue-100 text-blue-600'
      case 'reach_out': return 'bg-violet-100 text-violet-600'
      default: return 'bg-neutral-100 text-neutral-600'
    }
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 80) return 'bg-rose-100 text-rose-700'
    if (priority >= 60) return 'bg-amber-100 text-amber-700'
    return 'bg-neutral-100 text-neutral-600'
  }

  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/flora-waving.png"
              alt="Flora"
              width={28}
              height={42}
              className="object-contain"
            />
            <CardTitle className="text-base font-semibold text-neutral-900">
              Flora&apos;s Suggestions
            </CardTitle>
            {actions.length > 0 && (
              <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {actions.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600"
            title="Generate new suggestions"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {actions.length > 0 ? (
          <div className="space-y-1">
            {actions.map((action) => {
              const Icon = getActionIcon(action.action_type)
              const iconColor = getIconColor(action.action_type)
              const priorityBadge = getPriorityBadge(action.priority)

              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                >
                  {/* Icon */}
                  <div className={`h-8 w-8 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/contacts/${action.contact_id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-primary-600 truncate"
                      >
                        {action.contact.first_name} {action.contact.last_name}
                      </Link>
                      <span className="text-neutral-300">-</span>
                      <span className="text-sm text-neutral-600 truncate">
                        {action.title}
                      </span>
                    </div>
                  </div>

                  {/* Priority badge */}
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priorityBadge} flex-shrink-0`}>
                    {action.priority}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComplete(action.id)}
                      disabled={isPending || completingId === action.id}
                      className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Complete"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(action.id)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <p className="text-sm text-neutral-600 mb-3">
              Generate smart suggestions based on your donors.
            </p>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
