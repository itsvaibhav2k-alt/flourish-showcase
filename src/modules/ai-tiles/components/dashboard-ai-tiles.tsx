'use client'

import { useState, useTransition, useCallback } from 'react'
import { SimpleTileGrid, TileConfig } from './tile-grid'
import { DonorHealthTile, DonorHealthInsight } from './donor-health-tile'
import { WeeklyPrioritiesTile, WeeklyPrioritiesInsight } from './weekly-priorities-tile'
import { OrgPulseTile, OrgPulseInsight } from './org-pulse-tile'
import { CustomTile, CustomInsight } from './custom-tile'
import { refreshAITilesAction } from '../actions/refresh-tiles'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CachedTileContent<T = unknown> {
  content: T
  generatedAt: string
  expiresAt?: string
}

export interface CustomTileData {
  id: string
  name: string
  description?: string
}

interface DashboardAITilesProps {
  organizationId: string
  enabledBuiltInTiles: string[]
  customTiles: CustomTileData[]
  cachedTilesData: Record<string, CachedTileContent>
}

// Generator output types (what the AI generators actually produce)
interface GeneratorDonorHealth {
  summary: string
  atRiskDonors: Array<{
    id: string
    name: string
    riskLevel: 'high' | 'medium' | 'low'
    reason: string
    suggestedAction: string
    optimalAskAmount?: number
  }>
  givingTrends: {
    direction: 'up' | 'down' | 'stable'
    percentChange: number
    insight: string
  }
  recommendations: string[]
}

interface GeneratorOrgPulse {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs-attention'
  healthScore: number
  summary: string
  metrics: Array<{
    name: string
    value: string
    trend: 'up' | 'down' | 'stable'
    insight: string
  }>
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
  }>
  opportunities: string[]
}

interface GeneratorWeeklyPriorities {
  summary: string
  priorityContacts: Array<{
    id: string
    name: string
    type: 'donor' | 'volunteer' | 'prospect'
    priority: 'urgent' | 'high' | 'medium'
    reason: string
    suggestedAction: string
    successProbability: number
  }>
  quickWins: string[]
  focusAreas: string[]
}

/**
 * Validate generator DonorHealth data structure
 */
function isValidGeneratorDonorHealth(data: unknown): data is GeneratorDonorHealth {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.summary === 'string' &&
    Array.isArray(d.atRiskDonors) &&
    d.givingTrends !== undefined &&
    typeof d.givingTrends === 'object' &&
    Array.isArray(d.recommendations)
  )
}

/**
 * Validate generator WeeklyPriorities data structure
 */
function isValidGeneratorWeeklyPriorities(data: unknown): data is GeneratorWeeklyPriorities {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.summary === 'string' &&
    Array.isArray(d.priorityContacts) &&
    Array.isArray(d.quickWins)
  )
}

/**
 * Validate generator OrgPulse data structure
 */
function isValidGeneratorOrgPulse(data: unknown): data is GeneratorOrgPulse {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.healthScore === 'number' &&
    typeof d.overallHealth === 'string' &&
    Array.isArray(d.metrics) &&
    Array.isArray(d.alerts) &&
    Array.isArray(d.opportunities)
  )
}

/**
 * Transform generator DonorHealth to UI format
 */
function transformDonorHealth(gen: GeneratorDonorHealth): DonorHealthInsight {
  // Calculate health score from giving trend
  let healthScore = 70 // Default
  if (gen.givingTrends.direction === 'up') healthScore = 85
  else if (gen.givingTrends.direction === 'down') healthScore = 50

  // Determine overall health
  let overallHealth: DonorHealthInsight['overallHealth'] = 'good'
  if (healthScore >= 80) overallHealth = 'excellent'
  else if (healthScore >= 60) overallHealth = 'good'
  else if (healthScore >= 40) overallHealth = 'fair'
  else overallHealth = 'poor'

  return {
    overallHealth,
    healthScore,
    totalAtRisk: gen.atRiskDonors.length,
    atRiskDonors: gen.atRiskDonors.slice(0, 5).map(d => {
      const nameParts = d.name.split(' ')
      return {
        id: d.id,
        firstName: nameParts[0] || 'Unknown',
        lastName: nameParts.slice(1).join(' ') || '',
        riskLevel: d.riskLevel,
        lastGiftDays: 90, // Default placeholder
        lifetimeGiving: d.optimalAskAmount || 0,
      }
    }),
    givingTrend: {
      direction: gen.givingTrends.direction,
      percentage: Math.abs(gen.givingTrends.percentChange),
      period: 'vs last month',
    },
    recommendations: gen.recommendations,
  }
}

/**
 * Transform generator OrgPulse to UI format
 */
function transformOrgPulse(gen: GeneratorOrgPulse): OrgPulseInsight {
  return {
    healthScore: gen.healthScore,
    overallStatus: gen.overallHealth === 'needs-attention' ? 'needs-attention' : gen.overallHealth,
    keyMetrics: gen.metrics.slice(0, 4).map((m, i) => ({
      label: m.name,
      value: m.value,
      trend: m.trend === 'stable' ? 'neutral' : m.trend,
      trendValue: m.insight.substring(0, 20),
      status: m.trend === 'up' ? 'positive' : m.trend === 'down' ? 'negative' : 'neutral',
    })),
    alerts: gen.alerts.slice(0, 3).map((a, i) => ({
      id: `alert-${i}`,
      severity: a.type === 'warning' ? 'high' : a.type === 'info' ? 'medium' : 'low',
      message: a.message,
    })),
    opportunities: gen.opportunities.slice(0, 3).map((o, i) => ({
      id: `opp-${i}`,
      title: o.substring(0, 50),
      description: o,
      potentialValue: 0,
      actionUrl: '/dashboard',
    })),
  }
}

/**
 * Transform generator WeeklyPriorities to UI format
 */
function transformWeeklyPriorities(gen: GeneratorWeeklyPriorities): WeeklyPrioritiesInsight {
  const actionTypeMap: Record<string, 'send_ask' | 're_engage' | 'thank' | 'follow_up' | 'reach_out'> = {
    urgent: 're_engage',
    high: 'send_ask',
    medium: 'follow_up',
  }

  return {
    priorityContacts: gen.priorityContacts.slice(0, 5).map(c => {
      const nameParts = c.name.split(' ')
      return {
        id: c.id,
        firstName: nameParts[0] || 'Unknown',
        lastName: nameParts.slice(1).join(' ') || '',
        successProbability: c.successProbability,
        expectedValue: 0,
        actionType: actionTypeMap[c.priority] || 'reach_out',
        reason: c.reason,
      }
    }),
    quickWins: gen.quickWins.slice(0, 3).map((w, i) => ({
      id: `qw-${i}`,
      title: w.substring(0, 40),
      description: w,
      estimatedValue: 0,
      actionUrl: '/dashboard',
    })),
    totalExpectedValue: 0,
    focusArea: gen.focusAreas?.[0] || gen.summary.substring(0, 50),
  }
}

/**
 * Dashboard AI Tiles Section
 *
 * Renders all enabled AI tiles (built-in and custom) on the dashboard.
 * Handles loading states and refresh functionality.
 */
export function DashboardAITiles({
  organizationId,
  enabledBuiltInTiles,
  customTiles,
  cachedTilesData,
}: DashboardAITilesProps) {
  const [isPending, startTransition] = useTransition()
  const [refreshingTileId, setRefreshingTileId] = useState<string | null>(null)
  const [localCache, setLocalCache] = useState(cachedTilesData)

  // Handle refresh for a specific tile
  const handleRefresh = useCallback(async (tileType: 'built-in' | 'custom', tileId: string) => {
    setRefreshingTileId(tileId)
    startTransition(async () => {
      try {
        const result = await refreshAITilesAction(tileType, tileId)
        if (result.success && result.data) {
          // Update local cache with new data
          const cacheKey = tileType === 'custom' ? `custom:${tileId}` : tileId
          setLocalCache(prev => ({
            ...prev,
            [cacheKey]: {
              content: result.data,
              generatedAt: new Date().toISOString(),
            }
          }))
        }
      } catch (error) {
        console.error('Failed to refresh tile:', error)
      } finally {
        setRefreshingTileId(null)
      }
    })
  }, [])

  // Handle refresh all tiles
  const handleRefreshAll = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await refreshAITilesAction('all')
        if (result.success) {
          // Refresh the page to get new data
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to refresh all tiles:', error)
      }
    })
  }, [])

  // If no tiles are enabled, don't render anything
  if (enabledBuiltInTiles.length === 0 && customTiles.length === 0) {
    return null
  }

  // Build tile configurations
  const tiles: TileConfig[] = []

  // Add built-in tiles
  enabledBuiltInTiles.forEach((tileId) => {
    const isRefreshing = refreshingTileId === tileId
    const cachedData = localCache[tileId]
    const lastUpdated = cachedData?.generatedAt ? new Date(cachedData.generatedAt) : undefined

    switch (tileId) {
      case 'donor-health': {
        // Validate and transform generator output to UI format
        const genData = isValidGeneratorDonorHealth(cachedData?.content) ? cachedData.content : null
        const validData = genData ? transformDonorHealth(genData) : null
        tiles.push({
          id: 'donor-health',
          component: (
            <DonorHealthTile
              data={validData}
              isLoading={isRefreshing}
              lastUpdated={lastUpdated}
              onRefresh={() => handleRefresh('built-in', 'donor-health')}
            />
          ),
        })
        break
      }
      case 'weekly-priorities': {
        // Validate and transform generator output to UI format
        const genData = isValidGeneratorWeeklyPriorities(cachedData?.content) ? cachedData.content : null
        const validData = genData ? transformWeeklyPriorities(genData) : null
        tiles.push({
          id: 'weekly-priorities',
          component: (
            <WeeklyPrioritiesTile
              data={validData}
              isLoading={isRefreshing}
              lastUpdated={lastUpdated}
              onRefresh={() => handleRefresh('built-in', 'weekly-priorities')}
            />
          ),
        })
        break
      }
      case 'org-pulse': {
        // Validate and transform generator output to UI format
        const genData = isValidGeneratorOrgPulse(cachedData?.content) ? cachedData.content : null
        const validData = genData ? transformOrgPulse(genData) : null
        tiles.push({
          id: 'org-pulse',
          component: (
            <OrgPulseTile
              data={validData}
              isLoading={isRefreshing}
              lastUpdated={lastUpdated}
              onRefresh={() => handleRefresh('built-in', 'org-pulse')}
            />
          ),
        })
        break
      }
    }
  })

  // Add custom tiles
  customTiles.forEach((tile) => {
    const cacheKey = `custom:${tile.id}`
    const isRefreshing = refreshingTileId === tile.id
    const cachedData = localCache[cacheKey]
    const lastUpdated = cachedData?.generatedAt ? new Date(cachedData.generatedAt) : undefined

    // Map custom tile data to CustomInsight format - only if content exists and is valid
    let customInsight: CustomInsight | null = null
    if (cachedData?.content && typeof cachedData.content === 'object') {
      const content = cachedData.content as Record<string, unknown>
      // Check if it has at least summary or insights
      if (content.summary || (Array.isArray(content.insights) && content.insights.length > 0)) {
        customInsight = {
          title: tile.name,
          summary: typeof content.summary === 'string' ? content.summary : '',
          insights: Array.isArray(content.insights) ? content.insights as string[] : [],
          data: content.data as CustomInsight['data'],
        }
      }
    } else if (typeof cachedData?.content === 'string' && cachedData.content.trim()) {
      customInsight = {
        title: tile.name,
        summary: cachedData.content,
        insights: [],
      }
    }

    tiles.push({
      id: `custom-${tile.id}`,
      component: (
        <CustomTile
          data={customInsight}
          isLoading={isRefreshing}
          lastUpdated={lastUpdated}
          onRefresh={() => handleRefresh('custom', tile.id)}
        />
      ),
    })
  })

  // Check if any tiles have VALID data (not just cache entries)
  const hasAnyData = Object.values(localCache).some(entry => {
    if (!entry?.content) return false
    // Check if built-in tile data is valid (using generator format validators)
    if (isValidGeneratorDonorHealth(entry.content)) return true
    if (isValidGeneratorWeeklyPriorities(entry.content)) return true
    if (isValidGeneratorOrgPulse(entry.content)) return true
    // Check if custom tile data has content
    if (typeof entry.content === 'string' && entry.content.trim()) return true
    if (typeof entry.content === 'object') {
      const c = entry.content as Record<string, unknown>
      if (c.summary || (Array.isArray(c.insights) && c.insights.length > 0)) return true
    }
    return false
  })

  return (
    <div className="space-y-4">
      {/* Section Header - Clean, minimal style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">AI Insights</h2>
          </div>
          {!hasAnyData && tiles.length > 0 && (
            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
              Awaiting first analysis
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isPending}
          className="text-neutral-500 hover:text-neutral-700 h-7 px-2"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
          <span className="ml-1.5 text-xs">Refresh</span>
        </Button>
      </div>

      {/* Tiles Grid */}
      {tiles.length > 0 ? (
        <SimpleTileGrid tiles={tiles} />
      ) : (
        <div className="text-center py-10 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
          <Sparkles className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-600 mb-1">No AI Insights Enabled</p>
          <p className="text-xs text-neutral-400">
            Enable AI tiles in Settings → Add-ons
          </p>
        </div>
      )}
    </div>
  )
}
