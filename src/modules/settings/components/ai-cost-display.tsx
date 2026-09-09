'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DollarSign, Mail, MessageSquare, Heart, Users, Info, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIUsageStats {
  totalCost: number
  emailCount: number
  tokenCount: number
  breakdown: {
    thankYou: number
    reengagement: number
    volunteer: number
    other?: number
  }
}

interface AICostDisplayProps {
  stats: AIUsageStats
  floraTooltip: {
    title: string
    content: string
    tip?: string
  }
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(2)}`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`
  }
  return tokens.toString()
}

export function AICostDisplay({ stats, floraTooltip }: AICostDisplayProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const breakdownItems = [
    {
      label: 'Thank You',
      count: stats.breakdown.thankYou,
      icon: Heart,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Re-engagement',
      count: stats.breakdown.reengagement,
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Volunteer',
      count: stats.breakdown.volunteer,
      icon: Users,
      color: 'text-teal-600 bg-teal-50',
    },
  ]

  const totalBreakdown = stats.breakdown.thankYou + stats.breakdown.reengagement + stats.breakdown.volunteer

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold tracking-tight">
                Usage This Month
              </CardTitle>
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                    aria-label="Learn more about usage tracking"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-80 p-0 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-primary-50 to-violet-50 px-4 py-3 border-b border-primary-100">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/flora-explaining.png"
                        alt="Flora mascot"
                        width={40}
                        height={60}
                        className="object-contain"
                      />
                      <p className="font-medium text-primary-900 text-sm">Flora says...</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-medium text-neutral-900 text-sm mb-1">
                        {floraTooltip.title}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {floraTooltip.content}
                      </p>
                    </div>
                    {floraTooltip.tip && (
                      <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Pro tip:</span> {floraTooltip.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <CardDescription className="text-neutral-500 mt-1">
              AI-powered email generation costs and statistics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
            <p className="text-2xl font-bold text-neutral-900">{stats.emailCount}</p>
            <p className="text-xs text-neutral-500">Emails Generated</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
            <p className="text-2xl font-bold text-emerald-700">{formatCost(stats.totalCost)}</p>
            <p className="text-xs text-emerald-600">Estimated Cost</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
            <p className="text-2xl font-bold text-neutral-900">{formatTokens(stats.tokenCount)}</p>
            <p className="text-xs text-neutral-500">Tokens Used</p>
          </div>
        </div>

        {/* Breakdown by Type */}
        {totalBreakdown > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Breakdown by Type
            </p>
            <div className="space-y-2">
              {breakdownItems.map((item) => (
                item.count > 0 && (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('h-7 w-7 rounded-md flex items-center justify-center', item.color)}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-neutral-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-900">{item.count}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.emailCount === 0 && (
          <div className="p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">No AI-generated emails this month</p>
            <p className="text-xs text-neutral-500 mt-1">
              Usage statistics will appear here once you start generating emails
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
