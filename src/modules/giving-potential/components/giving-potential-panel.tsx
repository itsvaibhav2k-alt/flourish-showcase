'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScoreMeter, CircularScoreMeter } from './score-meter'
import { GivingPotentialForm } from './giving-potential-form'
import {
  TrendingUp,
  DollarSign,
  Edit2,
  Briefcase,
  Home,
  LineChart,
  Users,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'

interface GivingPotentialData {
  overall_score: number
  capacity_score: number
  affinity_score: number
  propensity_score: number
  estimated_capacity: number
  current_giving: number
  employer?: string | null
  job_title?: string | null
  estimated_net_worth?: number | null
  real_estate_value?: number | null
  stock_holdings?: number | null
  political_donations?: number | null
  nonprofit_board_count?: number | null
  notes?: string | null
}

interface GivingPotentialPanelProps {
  contactId: string
  data?: GivingPotentialData | null
  className?: string
}

/**
 * Detailed panel for displaying giving potential on contact detail page
 * Shows all scores, wealth breakdown, giving gap, and edit functionality
 */
export function GivingPotentialPanel({
  contactId,
  data,
  className
}: GivingPotentialPanelProps) {
  const [isEditing, setIsEditing] = useState(false)

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return 'Unknown'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const givingGap = data
    ? data.estimated_capacity - data.current_giving
    : 0

  if (isEditing) {
    return (
      <Card className={cn('overflow-hidden shadow-sm', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Edit Giving Potential
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Update wealth indicators and employment data
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <GivingPotentialForm
            contactId={contactId}
            initialData={data || undefined}
            onSuccess={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={cn('overflow-hidden shadow-sm', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Giving Potential
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  AI-powered donor capacity analysis
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-3">
              <AlertCircle className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-900 mb-1">
              No data available
            </p>
            <p className="text-sm text-neutral-500 mb-4 max-w-sm">
              Add employment and wealth information to calculate giving potential
            </p>
            <Button onClick={() => setIsEditing(true)} variant="primary">
              Add Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Giving Potential
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                AI-powered donor capacity analysis
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Overall Score */}
        <div className="py-4 border-b border-neutral-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-neutral-700">Overall Potential</h4>
            <ScoreInfoButton
              scoreKey="givingPotentialOverall"
              value={data.overall_score}
              size="sm"
              scoreDefinitions={scoreDefinitions}
            />
          </div>
          <div className="flex items-center justify-center">
            <CircularScoreMeter
              score={data.overall_score}
              label=""
              size={140}
            />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-700">
            Score Breakdown
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ScoreMeter
                  score={data.capacity_score}
                  label="Capacity"
                  size="md"
                />
              </div>
              <ScoreInfoButton
                scoreKey="capacityScore"
                value={data.capacity_score}
                size="sm"
                scoreDefinitions={scoreDefinitions}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ScoreMeter
                  score={data.affinity_score}
                  label="Affinity"
                  size="md"
                />
              </div>
              <ScoreInfoButton
                scoreKey="affinityScore"
                value={data.affinity_score}
                size="sm"
                scoreDefinitions={scoreDefinitions}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ScoreMeter
                  score={data.propensity_score}
                  label="Propensity"
                  size="md"
                />
              </div>
              <ScoreInfoButton
                scoreKey="propensityScore"
                value={data.propensity_score}
                size="sm"
                scoreDefinitions={scoreDefinitions}
              />
            </div>
          </div>
        </div>

        {/* Giving Gap */}
        <div className="rounded-lg bg-gradient-to-br from-primary-50 to-violet-50 border border-primary-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              <h4 className="text-sm font-semibold text-primary-900">
                Giving Gap Analysis
              </h4>
              <ScoreInfoButton
                scoreKey="givingGap"
                value={givingGap}
                size="sm"
                scoreDefinitions={scoreDefinitions}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-primary-700 mb-1">Capacity</p>
              <p className="text-sm font-bold text-primary-900">
                {formatCurrency(data.estimated_capacity)}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary-700 mb-1">Current</p>
              <p className="text-sm font-bold text-primary-900">
                {formatCurrency(data.current_giving)}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary-700 mb-1">Gap</p>
              <p className="text-sm font-bold text-primary-900">
                {formatCurrency(givingGap)}
              </p>
            </div>
          </div>
        </div>

        {/* Wealth Indicators */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-neutral-700">
            Wealth Indicators
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {data.employer && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Employer</p>
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {data.employer}
                  </p>
                </div>
              </div>
            )}
            {data.job_title && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Job Title</p>
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {data.job_title}
                  </p>
                </div>
              </div>
            )}
            {data.real_estate_value && (
              <div className="flex items-start gap-2">
                <Home className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Real Estate</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCurrency(data.real_estate_value)}
                  </p>
                </div>
              </div>
            )}
            {data.stock_holdings && (
              <div className="flex items-start gap-2">
                <LineChart className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Stock Holdings</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCurrency(data.stock_holdings)}
                  </p>
                </div>
              </div>
            )}
            {data.estimated_net_worth && (
              <div className="flex items-start gap-2 col-span-2">
                <DollarSign className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">Estimated Net Worth</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCurrency(data.estimated_net_worth)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Philanthropy Activity */}
        {(data.political_donations || data.nonprofit_board_count) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-700">
              Philanthropy Activity
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.political_donations && (
                <Badge variant="secondary" className="text-xs">
                  Political: {formatCurrency(data.political_donations)}
                </Badge>
              )}
              {data.nonprofit_board_count && (
                <Badge variant="secondary" className="text-xs">
                  {data.nonprofit_board_count} Board{data.nonprofit_board_count > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-700">Notes</h4>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap">
              {data.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
