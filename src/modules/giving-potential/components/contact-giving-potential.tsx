'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  Plus,
  ExternalLink,
  AlertCircle,
  Building2,
  Briefcase,
  Home,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

interface GivingPotential {
  id: string
  contact_id: string
  organization_id: string
  estimated_net_worth: number | null
  real_estate_value: number | null
  stock_holdings: number | null
  political_donations: number | null
  nonprofit_board_count: number
  employer: string | null
  job_title: string | null
  capacity_score: number | null
  affinity_score: number | null
  propensity_score: number | null
  overall_score: number | null
  giving_gap_ratio: number | null
  data_sources: Record<string, any>
  notes: string | null
  last_enriched_at: string | null
  created_at: string
  updated_at: string
}

interface ContactGivingPotentialProps {
  contactId: string
  givingPotential?: GivingPotential | null
  showAddButton?: boolean
}

/**
 * ContactGivingPotential
 * Displays giving potential information for a contact
 * Shows score, estimated capacity, and wealth indicators
 */
export function ContactGivingPotential({
  contactId,
  givingPotential = null,
  showAddButton = true,
}: ContactGivingPotentialProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' }
    if (score >= 80) return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' }
    if (score >= 70) return { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'text-violet-600' }
    return { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: 'text-neutral-600' }
  }

  // No giving potential data exists
  if (!givingPotential) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-neutral-700">Giving Potential</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                AI-powered capacity analysis
              </p>
            </div>
          </div>

          <div className="py-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary-400" />
            </div>
            <p className="text-sm text-neutral-600 mb-1">No potential analysis yet</p>
            <p className="text-xs text-neutral-400 mb-4">
              Analyze this contact's giving capacity
            </p>
            {showAddButton && (
              <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Giving Potential
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const overallScore = givingPotential.overall_score || 0
  const scoreColors = getScoreColor(overallScore)

  // Build wealth indicators from data
  const wealthIndicators: { icon: React.ReactNode; label: string; value: string }[] = []

  if (givingPotential.estimated_net_worth) {
    wealthIndicators.push({
      icon: <DollarSign className="h-3.5 w-3.5" />,
      label: 'Est. Net Worth',
      value: formatCurrency(givingPotential.estimated_net_worth),
    })
  }
  if (givingPotential.real_estate_value) {
    wealthIndicators.push({
      icon: <Home className="h-3.5 w-3.5" />,
      label: 'Real Estate',
      value: formatCurrency(givingPotential.real_estate_value),
    })
  }
  if (givingPotential.stock_holdings) {
    wealthIndicators.push({
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      label: 'Stock Holdings',
      value: formatCurrency(givingPotential.stock_holdings),
    })
  }
  if (givingPotential.employer) {
    wealthIndicators.push({
      icon: <Building2 className="h-3.5 w-3.5" />,
      label: 'Employer',
      value: givingPotential.employer,
    })
  }
  if (givingPotential.job_title) {
    wealthIndicators.push({
      icon: <Briefcase className="h-3.5 w-3.5" />,
      label: 'Position',
      value: givingPotential.job_title,
    })
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-neutral-700">Giving Potential</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {givingPotential.last_enriched_at
                ? `Enriched ${new Date(givingPotential.last_enriched_at).toLocaleDateString()}`
                : `Updated ${new Date(givingPotential.updated_at).toLocaleDateString()}`
              }
            </p>
          </div>
          <Link href={`/prospects`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </Link>
        </div>

        {/* Score Badge */}
        <div className="mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${scoreColors.bg}`}>
            <Target className={`h-5 w-5 ${scoreColors.icon}`} />
            <div>
              <div className={`text-2xl font-bold ${scoreColors.text}`}>
                {overallScore}
              </div>
              <div className="text-xs text-neutral-600">Overall Score</div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {(givingPotential.capacity_score || givingPotential.affinity_score || givingPotential.propensity_score) && (
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-neutral-100">
            {givingPotential.capacity_score !== null && (
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{givingPotential.capacity_score}</div>
                <div className="text-xs text-neutral-500">Capacity</div>
              </div>
            )}
            {givingPotential.affinity_score !== null && (
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{givingPotential.affinity_score}</div>
                <div className="text-xs text-neutral-500">Affinity</div>
              </div>
            )}
            {givingPotential.propensity_score !== null && (
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{givingPotential.propensity_score}</div>
                <div className="text-xs text-neutral-500">Propensity</div>
              </div>
            )}
          </div>
        )}

        {/* Giving Gap */}
        {givingPotential.giving_gap_ratio !== null && givingPotential.giving_gap_ratio > 0 && (
          <div className="py-3 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">Untapped Potential</span>
              <span className="text-xs font-semibold text-amber-600">
                {Math.round(givingPotential.giving_gap_ratio * 100)}% gap
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(givingPotential.giving_gap_ratio * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Wealth Indicators */}
        {wealthIndicators.length > 0 && (
          <div className="space-y-2 py-3 border-t border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-neutral-600">Wealth Indicators</span>
            </div>
            <div className="space-y-2">
              {wealthIndicators.map((indicator, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-500">
                    {indicator.icon}
                    <span>{indicator.label}</span>
                  </div>
                  <span className="font-medium text-neutral-900">{indicator.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {givingPotential.notes && (
          <div className="space-y-2 py-3 border-t border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-neutral-600">Analysis Notes</span>
            </div>
            <p className={`text-xs text-neutral-600 leading-relaxed ${!isExpanded && givingPotential.notes.length > 150 ? 'line-clamp-2' : ''}`}>
              {givingPotential.notes}
            </p>
            {givingPotential.notes.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neutral-500 leading-relaxed">
              AI-powered analysis combining giving history, engagement patterns, and wealth indicators
              to predict potential giving capacity.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
