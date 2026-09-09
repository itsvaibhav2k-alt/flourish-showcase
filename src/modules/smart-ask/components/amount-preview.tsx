'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, Sparkles, Info } from 'lucide-react'
import type { SmartAskResult } from '@/lib/ai/smart-ask/calculate-amounts'

interface AmountPreviewProps {
  result: SmartAskResult
  contactName?: string
  onSelectAmount?: (amount: number, type: 'stretch' | 'target' | 'accessible') => void
}

/**
 * Preview component showing calculated Smart Ask amounts for a donor
 * Displays three suggestion tiers with confidence scores
 */
export function AmountPreview({ result, contactName, onSelectAmount }: AmountPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { color: 'bg-green-100 text-green-800', label: 'High' }
    if (confidence >= 0.6) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' }
    return { color: 'bg-orange-100 text-orange-800', label: 'Low' }
  }

  const suggestions = [
    {
      type: 'accessible' as const,
      title: 'Accessible',
      description: 'Safe, likely to convert',
      amount: result.accessibleAmount,
      confidence: result.accessibleConfidence,
      icon: Target,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      borderColor: 'border-teal-200',
    },
    {
      type: 'target' as const,
      title: 'Target',
      description: 'Recommended ask',
      amount: result.targetAmount,
      confidence: result.targetConfidence,
      icon: Sparkles,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      recommended: true,
    },
    {
      type: 'stretch' as const,
      title: 'Stretch',
      description: 'Ambitious, higher potential',
      amount: result.stretchAmount,
      confidence: result.stretchConfidence,
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ]

  return (
    <Card className="shadow-card border-neutral-200/60">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {contactName ? `Smart Ask for ${contactName}` : 'Smart Ask Suggestions'}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Base amount: {formatCurrency(result.baseAmount)} ({result.calculationMethod})
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Amounts Grid */}
        <div className="grid gap-3 md:grid-cols-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon
            const confidenceBadge = getConfidenceBadge(suggestion.confidence)

            return (
              <Card
                key={suggestion.type}
                className={`border-2 ${suggestion.borderColor} ${
                  suggestion.recommended ? 'ring-2 ring-blue-100' : ''
                } relative overflow-hidden`}
              >
                {suggestion.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-bl-md font-medium">
                    Recommended
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg ${suggestion.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${suggestion.iconColor}`} />
                    </div>
                    <Badge className={confidenceBadge.color}>
                      {formatConfidence(suggestion.confidence)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {suggestion.title}
                      </p>
                      <p className="text-2xl font-bold text-neutral-900 mt-1">
                        {formatCurrency(suggestion.amount)}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-400">{suggestion.description}</p>
                    {onSelectAmount && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => onSelectAmount(suggestion.amount, suggestion.type)}
                      >
                        Use This Amount
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Reasoning */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-neutral-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-neutral-700 mb-1">Calculation Reasoning</p>
              <p className="text-sm text-neutral-600 leading-relaxed">{result.reasoning}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
