'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Plus,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { InsightTile } from './insight-tile'
import { CopilotActionsPanel } from './copilot-actions-panel'
import { PageGuideTrigger } from '@/components/common/page-guide-trigger'
import {
  getDonorHealthScore,
  getWeeklyPriorities,
  getOrgPulse,
  type DonorHealthScore,
  type WeeklyPriority,
  type OrgPulse,
} from '../queries/get-insights-data'

export function AIInsightsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [donorHealth, setDonorHealth] = useState<DonorHealthScore | null>(null)
  const [weeklyPriorities, setWeeklyPriorities] = useState<WeeklyPriority[]>([])
  const [orgPulse, setOrgPulse] = useState<OrgPulse | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [healthResult, prioritiesResult, pulseResult] = await Promise.all([
        getDonorHealthScore(),
        getWeeklyPriorities(),
        getOrgPulse(),
      ])

      if (healthResult.success && healthResult.data) {
        setDonorHealth(healthResult.data)
      }

      if (prioritiesResult.success && prioritiesResult.data) {
        setWeeklyPriorities(prioritiesResult.data)
      }

      if (pulseResult.success && pulseResult.data) {
        setOrgPulse(pulseResult.data)
      }
    } catch (error) {
      console.error('Error fetching insights data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-8">
      <FloraBreadcrumb currentPage="Insights" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-500" />
            AI Insights
          </h2>
          <p className="text-gray-500 mt-1">
            Real-time intelligence powered by Flora
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Tile
          </Button>
          <PageGuideTrigger pageKey="insights" />
        </div>
      </div>

      {/* Copilot Actions */}
      <CopilotActionsPanel />

      {/* Insight Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Donor Health Tile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InsightTile
            title="Donor Health"
            icon={<Heart className="h-5 w-5 text-rose-500" />}
            badge={
              isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : donorHealth ? (
                <Badge
                  variant="secondary"
                  className={`${
                    donorHealth.score >= 70
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Score: {donorHealth.score}
                </Badge>
              ) : null
            }
          >
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <Skeleton className="w-32 h-32 rounded-full" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : donorHealth ? (
              <div className="space-y-4">
                {/* Health Score Ring */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={donorHealth.score >= 70 ? '#10b981' : '#f59e0b'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${donorHealth.score * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-gray-900">
                          {donorHealth.score}
                        </span>
                        <span className="block text-xs text-gray-500">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* At Risk Alert */}
                {donorHealth.atRiskCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      {donorHealth.atRiskCount} donor{donorHealth.atRiskCount !== 1 ? 's' : ''} at risk
                    </span>
                  </div>
                )}

                {/* Top Insight */}
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                  {donorHealth.topInsight}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No donor health data available</p>
              </div>
            )}
          </InsightTile>
        </motion.div>

        {/* Weekly Priorities Tile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InsightTile
            title="Weekly Priorities"
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            badge={
              isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {weeklyPriorities.length} action{weeklyPriorities.length !== 1 ? 's' : ''}
                </Badge>
              )
            }
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : weeklyPriorities.length > 0 ? (
              <div className="space-y-3">
                {weeklyPriorities.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.contactName}</p>
                      <p className="text-sm text-gray-500">{item.action}</p>
                    </div>
                    <Badge
                      variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No priorities this week</p>
                <p className="text-xs mt-1">Your donor relationships are healthy!</p>
              </div>
            )}
          </InsightTile>
        </motion.div>

        {/* Organization Pulse Tile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <InsightTile
            title="Organization Pulse"
            icon={<Users className="h-5 w-5 text-violet-500" />}
            badge={
              isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : orgPulse && orgPulse.alerts > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  {orgPulse.alerts} alert{orgPulse.alerts !== 1 ? 's' : ''}
                </Badge>
              ) : null
            }
          >
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : orgPulse ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">
                    ${orgPulse.totalRaised >= 1000 ? `${(orgPulse.totalRaised / 1000).toFixed(0)}K` : orgPulse.totalRaised.toFixed(0)}
                  </p>
                  <p className="text-xs text-emerald-600">Total Raised</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {orgPulse.donorCount}
                  </p>
                  <p className="text-xs text-blue-600">Active Donors</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {orgPulse.volunteerHours}
                  </p>
                  <p className="text-xs text-purple-600">Volunteer Hours</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">
                    {orgPulse.alerts}
                  </p>
                  <p className="text-xs text-amber-600">Alerts</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No organization data available</p>
              </div>
            )}
          </InsightTile>
        </motion.div>
      </div>

      {/* Custom Tiles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Custom AI Tiles
          </h3>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>

        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Create custom AI insights</p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Tile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
