'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, Sparkles, DollarSign, CheckCircle2 } from 'lucide-react'
import type { SmartAskAnalytics } from '../queries/get-smart-ask-analytics'

interface AskAnalyticsProps {
  analytics: SmartAskAnalytics
}

/**
 * Analytics component showing Smart Ask conversion rates and performance
 */
export function AskAnalytics({ analytics }: AskAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (rate: number) => {
    return `${Math.round(rate * 100)}%`
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const suggestionTypeIcons = {
    stretch: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    target: { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
    accessible: { icon: Target, color: 'text-teal-600', bg: 'bg-teal-50' },
    custom: { icon: DollarSign, color: 'text-neutral-600', bg: 'bg-neutral-50' },
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card border-neutral-200/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Total Suggestions
                </p>
                <p className="text-2xl font-semibold text-neutral-900 mt-2">
                  {analytics.totalSuggestions.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-neutral-200/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Conversions
                </p>
                <p className="text-2xl font-semibold text-green-600 mt-2">
                  {analytics.totalConversions.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-neutral-200/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Conversion Rate
                </p>
                <p className="text-2xl font-semibold text-neutral-900 mt-2">
                  {formatPercent(analytics.conversionRate)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-neutral-200/60">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Avg Gift
                </p>
                <p className="text-2xl font-semibold text-neutral-900 mt-2">
                  {formatCurrency(analytics.averageGiftAmount)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Suggestion Type */}
      <Card className="shadow-card border-neutral-200/60">
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Performance by Suggestion Type</h3>
          <p className="text-sm text-neutral-500">
            Conversion rates for each suggestion tier
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(analytics.suggestionTypeBreakdown).map(([type, data]) => {
              const iconConfig = suggestionTypeIcons[type as keyof typeof suggestionTypeIcons]
              const Icon = iconConfig.icon

              return (
                <div key={type} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-8 w-8 rounded-lg ${iconConfig.bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${iconConfig.color}`} />
                    </div>
                    <p className="text-sm font-medium text-neutral-900 capitalize">{type}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Shown:</span>
                      <span className="font-medium text-neutral-900">{data.count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Converted:</span>
                      <span className="font-medium text-green-600">{data.converted}</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Rate:</span>
                        <Badge
                          className={
                            data.rate >= 0.5
                              ? 'bg-green-100 text-green-800'
                              : data.rate >= 0.3
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {formatPercent(data.rate)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Suggestions */}
      <Card className="shadow-card border-neutral-200/60">
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Recent Suggestions</h3>
          <p className="text-sm text-neutral-500">
            Last 10 Smart Ask suggestions and their outcomes
          </p>
        </CardHeader>
        <CardContent>
          {analytics.recentSuggestions.length > 0 ? (
            <div className="space-y-2">
              {analytics.recentSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-neutral-600">
                          {suggestion.contact_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {suggestion.contact_name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(suggestion.suggested_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {formatCurrency(suggestion.shown_amount)}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">
                        {suggestion.suggestion_type}
                      </p>
                    </div>
                    <div className="w-20 text-right">
                      {suggestion.converted ? (
                        <Badge className="bg-green-100 text-green-800">
                          {formatCurrency(suggestion.actual_gift_amount || 0)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-neutral-400">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <p className="text-sm">No suggestions recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
