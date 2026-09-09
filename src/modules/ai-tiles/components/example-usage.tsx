/**
 * AI Tiles Example Usage
 *
 * This file demonstrates how to use the AI tile components
 * with sample data and common patterns.
 */

'use client'

import { useState } from 'react'
import {
  DonorHealthTile,
  WeeklyPrioritiesTile,
  OrgPulseTile,
  CustomTile,
  TileGrid,
  SimpleTileGrid,
  type DonorHealthInsight,
  type WeeklyPrioritiesInsight,
  type OrgPulseInsight,
  type CustomInsight,
  type TileConfig,
} from './index'
import { Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Example 1: Basic Usage with Sample Data
 */
export function AITilesExample() {
  const [isLoading, setIsLoading] = useState(false)

  // Sample data for Donor Health Tile
  const donorHealthData: DonorHealthInsight = {
    overallHealth: 'good',
    healthScore: 78,
    totalAtRisk: 12,
    givingTrend: {
      direction: 'up',
      percentage: 15,
      period: 'vs last quarter',
    },
    atRiskDonors: [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        riskLevel: 'high',
        lastGiftDays: 365,
        lifetimeGiving: 12500,
      },
      {
        id: '2',
        firstName: 'Michael',
        lastName: 'Chen',
        riskLevel: 'medium',
        lastGiftDays: 180,
        lifetimeGiving: 8900,
      },
      {
        id: '3',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        riskLevel: 'low',
        lastGiftDays: 120,
        lifetimeGiving: 5200,
      },
    ],
    recommendations: [
      'Send personalized re-engagement emails to high-risk donors this week',
      'Schedule phone calls with top 3 at-risk donors to understand their giving patterns',
      'Create a donor appreciation event to strengthen relationships',
    ],
  }

  // Sample data for Weekly Priorities Tile
  const weeklyPrioritiesData: WeeklyPrioritiesInsight = {
    focusArea: 'Year-End Campaign Push',
    totalExpectedValue: 45000,
    priorityContacts: [
      {
        id: '1',
        firstName: 'David',
        lastName: 'Thompson',
        successProbability: 85,
        expectedValue: 15000,
        actionType: 'send_ask',
        reason: 'Strong giving history, increased capacity signals',
      },
      {
        id: '2',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        successProbability: 72,
        expectedValue: 10000,
        actionType: 're_engage',
        reason: 'Previous major donor, last gift 18 months ago',
      },
      {
        id: '3',
        firstName: 'Robert',
        lastName: 'Wilson',
        successProbability: 68,
        expectedValue: 8000,
        actionType: 'follow_up',
        reason: 'Recent event attendance, expressed interest',
      },
    ],
    quickWins: [
      {
        id: '1',
        title: 'Send thank-you video to recent donors',
        description: 'Personal video messages show 3x higher retention',
        estimatedValue: 5000,
        actionUrl: '/communications/new',
      },
      {
        id: '2',
        title: 'Schedule coffee meeting with board member',
        description: 'Warm introduction to potential major donor',
        estimatedValue: 12000,
        actionUrl: '/contacts/new',
      },
    ],
  }

  // Sample data for Org Pulse Tile
  const orgPulseData: OrgPulseInsight = {
    healthScore: 82,
    overallStatus: 'good',
    keyMetrics: [
      {
        label: 'Active Donors',
        value: '342',
        trend: 'up',
        trendValue: '+12%',
        status: 'positive',
      },
      {
        label: 'Avg Gift Size',
        value: '$245',
        trend: 'up',
        trendValue: '+8%',
        status: 'positive',
      },
      {
        label: 'Retention Rate',
        value: '68%',
        trend: 'down',
        trendValue: '-3%',
        status: 'negative',
      },
      {
        label: 'New Donors',
        value: '47',
        trend: 'up',
        trendValue: '+22%',
        status: 'positive',
      },
    ],
    alerts: [
      {
        id: '1',
        severity: 'high',
        message: '3 major donors have not given in 12+ months',
        actionUrl: '/donors?filter=lapsed',
      },
      {
        id: '2',
        severity: 'medium',
        message: 'Volunteer shift next Tuesday is only 40% filled',
        actionUrl: '/volunteers/shifts',
      },
    ],
    opportunities: [
      {
        id: '1',
        title: 'Launch monthly giving program',
        description: 'Convert 15-20% of one-time donors to recurring',
        potentialValue: 24000,
        actionUrl: '/campaigns/new',
      },
      {
        id: '2',
        title: 'Corporate matching program outreach',
        description: '12 donors work at companies with matching programs',
        potentialValue: 18000,
        actionUrl: '/contacts?filter=corporate-match',
      },
    ],
  }

  // Sample data for Custom Tile
  const customData: CustomInsight = {
    title: 'Volunteer Engagement',
    icon: Users,
    summary:
      'Your volunteer program is thriving! Engagement is up 25% this quarter with strong retention.',
    insights: [
      'Top volunteers are averaging 12 hours per month',
      '3 volunteers are ready for leadership roles',
      'Event attendance correlation with giving is 78%',
    ],
    data: [
      {
        key: 'active',
        label: 'Active Volunteers',
        value: 87,
        type: 'number',
        highlight: true,
      },
      {
        key: 'hours',
        label: 'Total Hours',
        value: 1240,
        type: 'number',
      },
      {
        key: 'retention',
        label: 'Retention Rate',
        value: 92,
        type: 'percentage',
        highlight: true,
      },
      {
        key: 'impact',
        label: 'Economic Impact',
        value: 35000,
        type: 'currency',
      },
    ],
    actionUrl: '/volunteers',
    actionLabel: 'View All Volunteers',
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">AI Insights Dashboard</h2>
          <p className="text-sm text-neutral-500 mt-1">
            AI-powered insights to help you make better decisions
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          Refresh All
        </Button>
      </div>

      <SimpleTileGrid
        tiles={[
          {
            id: 'org-pulse',
            component: (
              <OrgPulseTile
                data={orgPulseData}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                lastUpdated={new Date()}
              />
            ),
            gridSpan: 'double', // Takes 2 columns on desktop
          },
          {
            id: 'donor-health',
            component: (
              <DonorHealthTile
                data={donorHealthData}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                lastUpdated={new Date()}
              />
            ),
          },
          {
            id: 'weekly-priorities',
            component: (
              <WeeklyPrioritiesTile
                data={weeklyPrioritiesData}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                lastUpdated={new Date()}
              />
            ),
          },
          {
            id: 'custom-volunteer',
            component: (
              <CustomTile
                data={customData}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                lastUpdated={new Date()}
              />
            ),
          },
        ]}
      />
    </div>
  )
}

/**
 * Example 2: Draggable Tile Grid with Custom Order
 */
export function DraggableAITilesExample() {
  const [tiles, setTiles] = useState<TileConfig[]>([
    {
      id: 'donor-health',
      component: (
        <DonorHealthTile
          data={null}
          isLoading={false}
        />
      ),
    },
    {
      id: 'weekly-priorities',
      component: (
        <WeeklyPrioritiesTile
          data={null}
          isLoading={false}
        />
      ),
    },
    {
      id: 'org-pulse',
      component: (
        <OrgPulseTile
          data={null}
          isLoading={false}
        />
      ),
    },
  ])

  const handleReorder = (newTiles: TileConfig[]) => {
    setTiles(newTiles)
    // Save order to backend or localStorage
    console.log('New tile order:', newTiles.map((t) => t.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          Drag tiles to reorder
        </h2>
      </div>

      <TileGrid
        tiles={tiles}
        onReorder={handleReorder}
        isDraggable={true}
      />
    </div>
  )
}

/**
 * Example 3: Loading States
 */
export function AITilesLoadingExample() {
  return (
    <SimpleTileGrid
      tiles={[
        {
          id: 'donor-health-loading',
          component: <DonorHealthTile data={null} isLoading={true} />,
        },
        {
          id: 'weekly-priorities-loading',
          component: <WeeklyPrioritiesTile data={null} isLoading={true} />,
        },
        {
          id: 'org-pulse-loading',
          component: <OrgPulseTile data={null} isLoading={true} />,
        },
      ]}
    />
  )
}

/**
 * Example 4: Empty States
 */
export function AITilesEmptyExample() {
  return (
    <SimpleTileGrid
      tiles={[
        {
          id: 'donor-health-empty',
          component: <DonorHealthTile data={null} isLoading={false} />,
        },
        {
          id: 'weekly-priorities-empty',
          component: <WeeklyPrioritiesTile data={null} isLoading={false} />,
        },
        {
          id: 'org-pulse-empty',
          component: <OrgPulseTile data={null} isLoading={false} />,
        },
      ]}
    />
  )
}
