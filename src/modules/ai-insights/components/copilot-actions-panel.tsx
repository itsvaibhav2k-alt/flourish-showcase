'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFloraRecommendations, type FloraRecommendation } from '@/modules/ai-insights/queries/get-insights-data'

export interface CopilotAction {
  id: string
  type: 'reach_out' | 'send_ask' | 're_engage' | 'thank' | 'follow_up'
  title: string
  description: string
  contactName: string
  priority: 'high' | 'medium' | 'low'
  predictedAmount?: number
  successRate: number
  channel: 'email' | 'phone' | 'in_person'
}

interface CopilotActionsPanelProps {
  actions?: CopilotAction[]
}

const ACTION_ICONS = {
  reach_out: Phone,
  send_ask: DollarSign,
  re_engage: Mail,
  thank: Mail,
  follow_up: Calendar,
}

const ACTION_COLORS = {
  reach_out: 'text-blue-500 bg-blue-50',
  send_ask: 'text-emerald-500 bg-emerald-50',
  re_engage: 'text-amber-500 bg-amber-50',
  thank: 'text-violet-500 bg-violet-50',
  follow_up: 'text-gray-500 bg-gray-50',
}

/**
 * Maps FloraRecommendation to CopilotAction
 */
function mapRecommendationToAction(recommendation: FloraRecommendation): CopilotAction {
  // Map recommendation type to action type
  const typeMapping: Record<FloraRecommendation['recommendationType'], CopilotAction['type']> = {
    'at-risk': 're_engage',
    'major-donor': 'thank',
    'lapsed': 're_engage',
    're-engagement': 'follow_up',
  }

  // Determine channel based on recommendation type and lifetime giving
  let channel: CopilotAction['channel'] = 'email'
  if (recommendation.recommendationType === 'major-donor' && recommendation.lifetimeGiving >= 10000) {
    channel = recommendation.daysSinceLastGift && recommendation.daysSinceLastGift >= 180 ? 'phone' : 'email'
  } else if (recommendation.recommendationType === 'at-risk' && recommendation.lifetimeGiving >= 5000) {
    channel = 'phone'
  }

  // Generate title based on recommendation type
  const titleMapping: Record<FloraRecommendation['recommendationType'], string> = {
    'at-risk': 'At-risk donor needs attention',
    'major-donor': 'Major donor check-in',
    'lapsed': 'Re-engage lapsed donor',
    're-engagement': 'Engagement opportunity',
  }

  return {
    id: recommendation.id,
    type: typeMapping[recommendation.recommendationType],
    title: titleMapping[recommendation.recommendationType],
    description: recommendation.recommendedAction,
    contactName: `${recommendation.firstName} ${recommendation.lastName}`,
    priority: recommendation.priority,
    predictedAmount: recommendation.lifetimeGiving > 0 ? Math.round(recommendation.lifetimeGiving * 0.1) : undefined,
    successRate: recommendation.successProbability,
    channel,
  }
}

export function CopilotActionsPanel({ actions: propActions }: CopilotActionsPanelProps) {
  const [actions, setActions] = useState<CopilotAction[]>(propActions || [])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(!propActions)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If actions are provided via props, use them
    if (propActions) {
      setActions(propActions)
      setIsLoading(false)
      return
    }

    // Otherwise fetch from the server
    async function fetchActions() {
      setIsLoading(true)
      setError(null)

      const result = await getFloraRecommendations(10)

      if (result.success && result.data) {
        const mappedActions = result.data.map(mapRecommendationToAction)
        setActions(mappedActions)
      } else {
        setError(result.error || 'Failed to load recommendations')
        setActions([])
      }

      setIsLoading(false)
    }

    fetchActions()
  }, [propActions])

  const handleComplete = (id: string) => {
    setActions(actions.filter(a => a.id !== id))
  }

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]))
    setTimeout(() => {
      setActions(actions.filter(a => a.id !== id))
    }, 300)
  }

  const visibleActions = actions.filter(a => !dismissedIds.has(a.id))

  return (
    <Card className="border-violet-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Flora&apos;s Recommendations
          {!isLoading && (
            <Badge variant="secondary" className="bg-violet-100 text-violet-700">
              {visibleActions.length} actions
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8 text-gray-500"
            >
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading recommendations...</span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-gray-500"
            >
              <X className="h-12 w-12 text-red-400 mx-auto mb-2" />
              <p>{error}</p>
            </motion.div>
          ) : visibleActions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-gray-500"
            >
              <Check className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <p>All caught up! Check back later for new suggestions.</p>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {visibleActions.map((action) => {
                const Icon = ACTION_ICONS[action.type]
                const colorClass = ACTION_COLORS[action.type]

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {action.contactName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {action.successRate}% success
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            action.priority === 'high'
                              ? 'border-red-200 text-red-600 bg-red-50'
                              : action.priority === 'medium'
                              ? 'border-amber-200 text-amber-600 bg-amber-50'
                              : 'border-gray-200 text-gray-600 bg-gray-50'
                          }`}
                        >
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {action.description}
                      </p>
                      {action.predictedAmount && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">
                          Potential: ${action.predictedAmount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleDismiss(action.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700"
                        onClick={() => handleComplete(action.id)}
                      >
                        Take Action
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
