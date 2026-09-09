'use client'

import { motion } from 'framer-motion'
import { AITileCard } from './ai-tile-card'
import { Activity, TrendingUp, TrendingDown, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface KeyMetric {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  status: 'positive' | 'negative' | 'neutral'
}

export interface Alert {
  id: string
  severity: 'high' | 'medium' | 'low'
  message: string
  actionUrl?: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  potentialValue: number
  actionUrl: string
}

export interface OrgPulseInsight {
  healthScore: number // 0-100
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs-attention'
  keyMetrics: KeyMetric[]
  alerts: Alert[]
  opportunities: Opportunity[]
}

interface OrgPulseTileProps {
  data: OrgPulseInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}

/**
 * Organization Pulse Tile
 *
 * Displays overall organizational health with animated ring,
 * key metrics with trend indicators, alerts, and opportunities.
 */
export function OrgPulseTile({ data, isLoading, onRefresh, lastUpdated }: OrgPulseTileProps) {
  const getStatusColor = (status: OrgPulseInsight['overallStatus']) => {
    switch (status) {
      case 'excellent':
        return { gradient: 'from-green-500 to-emerald-500', text: 'text-green-700', bg: 'bg-green-50' }
      case 'good':
        return { gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-700', bg: 'bg-blue-50' }
      case 'fair':
        return { gradient: 'from-amber-500 to-yellow-500', text: 'text-amber-700', bg: 'bg-amber-50' }
      case 'needs-attention':
        return { gradient: 'from-rose-500 to-red-500', text: 'text-rose-700', bg: 'bg-rose-50' }
    }
  }

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-500' }
      case 'medium':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' }
      case 'low':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' }
    }
  }

  return (
    <AITileCard
      title="Organization Pulse"
      icon={<Activity />}
      isLoading={isLoading}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      {data ? (
        <div className="space-y-4">
          {/* Health Score Ring with Status */}
          <div className="flex items-center gap-4">
            {/* Animated ring */}
            <div className="relative h-28 w-28 flex-shrink-0">
              {/* Background ring */}
              <svg className="h-28 w-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-neutral-100"
                />
                {/* Animated progress ring with gradient */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="url(#pulseGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 301.6 }}
                  animate={{ strokeDashoffset: 301.6 - (301.6 * data.healthScore) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ strokeDasharray: 301.6 }}
                />
                <defs>
                  <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16804d" />
                    <stop offset="100%" stopColor="#4ade7f" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score number with animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="text-center"
                >
                  <motion.div
                    className="text-3xl font-bold text-neutral-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {data.healthScore}
                  </motion.div>
                  <div className="text-xs text-neutral-500 -mt-1">health</div>
                </motion.div>
              </div>

              {/* Pulse animation */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary-500/10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Status description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'h-2 w-2 rounded-full bg-gradient-to-r',
                  getStatusColor(data.overallStatus).gradient
                )} />
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Overall Status
                </span>
              </div>
              <div className="text-lg font-semibold text-neutral-900 capitalize mb-1">
                {data.overallStatus.replace('-', ' ')}
              </div>
              <p className="text-xs text-neutral-500">
                Based on {data.keyMetrics.length} key metrics
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          {data.keyMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {data.keyMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={cn(
                    'p-2.5 rounded-lg border',
                    metric.status === 'positive' ? 'bg-green-50 border-green-200' :
                    metric.status === 'negative' ? 'bg-rose-50 border-rose-200' :
                    'bg-neutral-50 border-neutral-200'
                  )}
                >
                  <p className="text-xs text-neutral-600 mb-0.5">{metric.label}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-neutral-900">{metric.value}</p>
                    <div className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      metric.status === 'positive' ? 'text-green-700' :
                      metric.status === 'negative' ? 'text-rose-700' :
                      'text-neutral-600'
                    )}>
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      <span>{metric.trendValue}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Alerts Section */}
          {data.alerts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                Alerts ({data.alerts.length})
              </h4>
              <div className="space-y-1.5">
                {data.alerts.slice(0, 3).map((alert, index) => {
                  const colors = getAlertColor(alert.severity)
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className={cn(
                        'p-2 rounded-lg border text-xs',
                        colors.bg,
                        colors.border
                      )}
                    >
                      {alert.actionUrl ? (
                        <Link href={alert.actionUrl} className="flex items-start gap-2 hover:opacity-80 transition-opacity">
                          <AlertCircle className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', colors.icon)} />
                          <p className={cn('flex-1', colors.text)}>{alert.message}</p>
                        </Link>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', colors.icon)} />
                          <p className={cn('flex-1', colors.text)}>{alert.message}</p>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Opportunities Section */}
          {data.opportunities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Opportunities
              </h4>
              <div className="space-y-2">
                {data.opportunities.slice(0, 2).map((opp, index) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <Link href={opp.actionUrl}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        className="p-2.5 rounded-lg bg-violet-50 border border-violet-200 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-neutral-900 flex-1">{opp.title}</p>
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +${opp.potentialValue.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">{opp.description}</p>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All clear state */}
          {data.alerts.length === 0 && data.opportunities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-3 rounded-lg bg-green-50 border border-green-200 text-center"
            >
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-900">All systems healthy</p>
              <p className="text-xs text-green-700">No alerts or immediate actions needed</p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <Activity className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">No Pulse Data Yet</p>
          <p className="text-xs text-neutral-400 max-w-[200px] mx-auto">
            Click refresh to analyze your organization health
          </p>
        </div>
      )}
    </AITileCard>
  )
}
