'use client'

import { motion } from 'framer-motion'
import { AITileCard } from './ai-tile-card'
import { Heart, TrendingDown, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface AtRiskDonor {
  id: string
  firstName: string
  lastName: string
  riskLevel: 'high' | 'medium' | 'low'
  lastGiftDays: number
  lifetimeGiving: number
}

export interface GivingTrend {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  period: string
}

export interface DonorHealthInsight {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  atRiskDonors: AtRiskDonor[]
  givingTrend: GivingTrend
  recommendations: string[]
  totalAtRisk: number
  healthScore: number // 0-100
}

interface DonorHealthTileProps {
  data: DonorHealthInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}

/**
 * Donor Health Tile
 *
 * Displays at-risk donors, giving trends, and AI-generated recommendations
 * for maintaining donor relationships.
 */
export function DonorHealthTile({ data, isLoading, onRefresh, lastUpdated }: DonorHealthTileProps) {
  const getRiskColor = (level: AtRiskDonor['riskLevel']) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-700',
        }
      case 'medium':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
        }
      case 'low':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
        }
    }
  }

  const getHealthColor = (health: DonorHealthInsight['overallHealth']) => {
    switch (health) {
      case 'excellent':
        return 'from-green-500 to-emerald-500'
      case 'good':
        return 'from-blue-500 to-cyan-500'
      case 'fair':
        return 'from-amber-500 to-yellow-500'
      case 'poor':
        return 'from-rose-500 to-red-500'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <AITileCard
      title="Donor Health"
      icon={<Heart />}
      isLoading={isLoading}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      {data ? (
        <div className="space-y-4">
          {/* Health Score Ring */}
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 flex-shrink-0">
              {/* Background ring */}
              <svg className="h-24 w-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-neutral-100"
                />
                {/* Animated progress ring */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="url(#healthGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * data.healthScore) / 100 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ strokeDasharray: 251.2 }}
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`stop-color-${data.overallHealth}`} />
                    <stop offset="100%" className={`stop-color-${data.overallHealth}-end`} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-neutral-900">
                    {data.healthScore}
                  </div>
                  <div className="text-xs text-neutral-500 -mt-1">score</div>
                </motion.div>
              </div>
            </div>

            {/* Overall health status */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'h-2 w-2 rounded-full bg-gradient-to-r',
                  getHealthColor(data.overallHealth)
                )} />
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Overall Health
                </span>
              </div>
              <div className="text-lg font-semibold text-neutral-900 capitalize mb-1">
                {data.overallHealth}
              </div>
              <p className="text-xs text-neutral-500">
                {data.totalAtRisk} donor{data.totalAtRisk !== 1 ? 's' : ''} at risk
              </p>
            </div>
          </div>

          {/* Giving Trend */}
          <div className={cn(
            'p-3 rounded-lg border',
            data.givingTrend.direction === 'up' ? 'bg-green-50 border-green-200' :
            data.givingTrend.direction === 'down' ? 'bg-rose-50 border-rose-200' :
            'bg-neutral-50 border-neutral-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.givingTrend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : data.givingTrend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                ) : (
                  <DollarSign className="h-4 w-4 text-neutral-600" />
                )}
                <span className="text-sm font-medium text-neutral-900">Giving Trend</span>
              </div>
              <div className={cn(
                'text-sm font-semibold',
                data.givingTrend.direction === 'up' ? 'text-green-700' :
                data.givingTrend.direction === 'down' ? 'text-rose-700' :
                'text-neutral-700'
              )}>
                {data.givingTrend.direction === 'up' ? '+' : data.givingTrend.direction === 'down' ? '-' : ''}
                {data.givingTrend.percentage}%
              </div>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              {data.givingTrend.period}
            </p>
          </div>

          {/* At-Risk Donors List */}
          {data.atRiskDonors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                At-Risk Donors
              </h4>
              <div className="space-y-2">
                {data.atRiskDonors.slice(0, 3).map((donor, index) => {
                  const colors = getRiskColor(donor.riskLevel)
                  return (
                    <motion.div
                      key={donor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/contacts/${donor.id}`}>
                        <div className={cn(
                          'p-2.5 rounded-lg border hover:shadow-sm transition-all cursor-pointer',
                          colors.bg,
                          colors.border
                        )}>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn('text-xs font-medium', colors.text, colors.bg)}>
                                {getInitials(donor.firstName, donor.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-neutral-900 truncate">
                                  {donor.firstName} {donor.lastName}
                                </p>
                                <span className={cn(
                                  'text-xs px-1.5 py-0.5 rounded-full font-medium capitalize',
                                  colors.badge
                                )}>
                                  {donor.riskLevel}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-600">
                                Last gift {donor.lastGiftDays} days ago • ${donor.lifetimeGiving.toLocaleString()} lifetime
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
              {data.totalAtRisk > 3 && (
                <Link href="/donors?filter=at-risk">
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-neutral-600">
                    View all {data.totalAtRisk} at-risk donors
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* AI Recommendations */}
          {data.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-700 mb-2">Recommendations</h4>
              <div className="space-y-1.5">
                {data.recommendations.slice(0, 3).map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-neutral-600 leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <Heart className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-600 mb-1">No Health Data Yet</p>
          <p className="text-xs text-neutral-400 max-w-[200px] mx-auto">
            Click refresh to analyze your donor relationships
          </p>
        </div>
      )}
    </AITileCard>
  )
}
