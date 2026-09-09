'use client'

import { motion } from 'framer-motion'
import { AITileCard } from './ai-tile-card'
import { Target, TrendingUp, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface PriorityContact {
  id: string
  firstName: string
  lastName: string
  successProbability: number // 0-100
  expectedValue: number
  actionType: 'send_ask' | 're_engage' | 'thank' | 'follow_up' | 'reach_out'
  reason: string
}

export interface QuickWin {
  id: string
  title: string
  description: string
  estimatedValue: number
  actionUrl: string
}

export interface WeeklyPrioritiesInsight {
  priorityContacts: PriorityContact[]
  quickWins: QuickWin[]
  totalExpectedValue: number
  focusArea: string
}

interface WeeklyPrioritiesTileProps {
  data: WeeklyPrioritiesInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}

/**
 * Weekly Priorities Tile
 *
 * Displays priority contacts with success probability indicators,
 * quick wins, and suggested actions for the week.
 */
export function WeeklyPrioritiesTile({ data, isLoading, onRefresh, lastUpdated }: WeeklyPrioritiesTileProps) {
  const getActionColor = (actionType: PriorityContact['actionType']) => {
    switch (actionType) {
      case 'send_ask':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
      case 're_engage':
        return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
      case 'thank':
        return { bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' }
      case 'follow_up':
        return { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' }
      case 'reach_out':
        return { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' }
    }
  }

  const getActionLabel = (actionType: PriorityContact['actionType']) => {
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
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600 bg-green-50'
    if (probability >= 60) return 'text-blue-600 bg-blue-50'
    if (probability >= 40) return 'text-amber-600 bg-amber-50'
    return 'text-neutral-600 bg-neutral-50'
  }

  return (
    <AITileCard
      title="Weekly Priorities"
      icon={<Target />}
      isLoading={isLoading}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      {data ? (
        <div className="space-y-4">
          {/* Focus Area Banner */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded bg-primary-500 flex items-center justify-center flex-shrink-0">
                <Target className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary-900 mb-0.5">This Week's Focus</p>
                <p className="text-sm font-semibold text-neutral-900">{data.focusArea}</p>
              </div>
            </div>
          </div>

          {/* Expected Value Metric */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <div>
              <p className="text-xs font-medium text-emerald-700 mb-0.5">Expected Value</p>
              <motion.p
                className="text-2xl font-bold text-emerald-900"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                ${data.totalExpectedValue.toLocaleString()}
              </motion.p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>

          {/* Priority Contacts */}
          {data.priorityContacts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2.5">Top Priorities</h4>
              <div className="space-y-2">
                {data.priorityContacts.slice(0, 5).map((contact, index) => {
                  const colors = getActionColor(contact.actionType)
                  return (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300 }}
                    >
                      <Link href={`/contacts/${contact.id}`}>
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          className={cn(
                            'p-2.5 rounded-lg border hover:shadow-md transition-shadow cursor-pointer group',
                            colors.bg,
                            'border-neutral-200'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className="relative">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn('text-xs font-semibold', colors.text, colors.bg)}>
                                  {getInitials(contact.firstName, contact.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              {/* Rank badge */}
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                {index + 1}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-neutral-900 truncate">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                <span className={cn(
                                  'text-xs px-1.5 py-0.5 rounded-full font-medium capitalize',
                                  colors.badge
                                )}>
                                  {getActionLabel(contact.actionType)}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600 line-clamp-1">{contact.reason}</p>
                            </div>

                            {/* Success indicator & value */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Success probability */}
                              <div className={cn(
                                'px-2 py-1 rounded-md text-xs font-bold',
                                getProbabilityColor(contact.successProbability)
                              )}>
                                {contact.successProbability}%
                              </div>
                              {/* Expected value */}
                              <div className="text-right">
                                <p className="text-xs font-bold text-emerald-700">
                                  ${contact.expectedValue.toLocaleString()}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {data.quickWins.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2.5 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Quick Wins
              </h4>
              <div className="space-y-2">
                {data.quickWins.slice(0, 3).map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Link href={win.actionUrl}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 mb-0.5">{win.title}</p>
                            <p className="text-xs text-neutral-600 line-clamp-2">{win.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-700">
                                ${win.estimatedValue.toLocaleString()}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">No Priorities Yet</p>
          <p className="text-xs text-neutral-400 max-w-[200px] mx-auto">
            Click refresh to generate AI-powered priority recommendations
          </p>
        </div>
      )}
    </AITileCard>
  )
}
