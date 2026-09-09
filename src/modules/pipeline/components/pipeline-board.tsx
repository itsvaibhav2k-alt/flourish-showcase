'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProspectCard, ProspectCardData, EmptyProspectCard } from './prospect-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react'

export type PipelineStage = 'identification' | 'qualification' | 'cultivation' | 'solicitation' | 'stewardship'

interface PipelineBoardProps {
  prospects: ProspectCardData[]
  onProspectClick?: (prospect: ProspectCardData) => void
  onStageChange?: (prospectId: string, newStage: PipelineStage) => Promise<void>
  className?: string
}

const STAGE_CONFIG: Record<PipelineStage, {
  label: string
  dotColor: string
  borderColor: string
  description: string
}> = {
  identification: {
    label: 'Identification',
    dotColor: 'bg-blue-500',
    borderColor: 'border-l-blue-500',
    description: 'Identifying potential major donors'
  },
  qualification: {
    label: 'Qualification',
    dotColor: 'bg-violet-500',
    borderColor: 'border-l-violet-500',
    description: 'Qualifying capacity and interest'
  },
  cultivation: {
    label: 'Cultivation',
    dotColor: 'bg-amber-500',
    borderColor: 'border-l-amber-500',
    description: 'Building relationship and engagement'
  },
  solicitation: {
    label: 'Solicitation',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-l-emerald-500',
    description: 'Ready to make the ask'
  },
  stewardship: {
    label: 'Stewardship',
    dotColor: 'bg-rose-500',
    borderColor: 'border-l-rose-500',
    description: 'Nurturing post-gift relationship'
  }
}

/**
 * Kanban board with 5 pipeline stage columns - Linear inspired design
 * - Click-to-move functionality via dropdown (no drag library needed)
 * - Shows prospect cards in each column
 * - Column headers with count badges and collapse/expand
 */
export function PipelineBoard({
  prospects,
  onProspectClick,
  onStageChange,
  className
}: PipelineBoardProps) {
  const [movingProspectId, setMovingProspectId] = useState<string | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Record<PipelineStage, boolean>>({
    identification: false,
    qualification: false,
    cultivation: false,
    solicitation: false,
    stewardship: false,
  })

  // Group prospects by stage
  const prospectsByStage = prospects.reduce((acc, prospect) => {
    if (!acc[prospect.stage]) {
      acc[prospect.stage] = []
    }
    acc[prospect.stage].push(prospect)
    return acc
  }, {} as Record<PipelineStage, ProspectCardData[]>)

  const handleStageChange = async (prospectId: string, newStage: string) => {
    if (!onStageChange) return

    setMovingProspectId(prospectId)
    try {
      await onStageChange(prospectId, newStage as PipelineStage)
    } finally {
      setMovingProspectId(null)
    }
  }

  const toggleColumnCollapse = (stage: PipelineStage) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [stage]: !prev[stage],
    }))
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((stage) => {
          const config = STAGE_CONFIG[stage]
          const stageProspects = prospectsByStage[stage] || []
          const isCollapsed = collapsedColumns[stage]

          return (
            <div
              key={stage}
              className={cn(
                "flex flex-col rounded-xl bg-neutral-50/80 border border-neutral-200/60",
                isCollapsed ? "w-12" : "min-w-[280px]"
              )}
            >
              {/* Column Header - Linear inspired */}
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 bg-neutral-100/80 rounded-t-xl border-b border-neutral-200/60",
                  isCollapsed && "flex-col py-4 gap-2"
                )}
              >
                <button
                  onClick={() => toggleColumnCollapse(stage)}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  )}
                  <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
                  {!isCollapsed && (
                    <h3 className="text-sm font-medium text-neutral-700">
                      {config.label}
                    </h3>
                  )}
                </button>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    "bg-neutral-200 text-neutral-600"
                  )}
                >
                  {stageProspects.length}
                </span>
              </div>

              {/* Column Content */}
              {!isCollapsed && (
                <>
                  <div className="flex-1 p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
                    {stageProspects.length === 0 ? (
                      <EmptyProspectCard />
                    ) : (
                      <>
                        {stageProspects.map((prospect) => (
                          <div key={prospect.id} className="space-y-2">
                            <ProspectCard
                              prospect={prospect}
                              onClick={() => onProspectClick?.(prospect)}
                              stageBorderColor={config.borderColor}
                            />

                            {/* Stage Move Dropdown */}
                            {onStageChange && (
                              <Select
                                value={prospect.stage}
                                onValueChange={(value) => handleStageChange(prospect.id, value)}
                                disabled={movingProspectId === prospect.id}
                              >
                                <SelectTrigger className="h-7 text-xs border-dashed bg-white/50">
                                  <SelectValue>
                                    {movingProspectId === prospect.id
                                      ? 'Moving...'
                                      : 'Move to stage'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(STAGE_CONFIG) as PipelineStage[]).map((s) => (
                                    <SelectItem
                                      key={s}
                                      value={s}
                                      disabled={s === prospect.stage}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", STAGE_CONFIG[s].dotColor)} />
                                        {STAGE_CONFIG[s].label}
                                        {s === prospect.stage && ' (current)'}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Add Card Button - Linear inspired */}
                  <div className="p-2 border-t border-neutral-200/60">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 h-8"
                      asChild
                    >
                      <Link href="/contacts">
                        <Plus className="h-4 w-4 mr-2" />
                        Add prospect
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              {/* Collapsed state - vertical text */}
              {isCollapsed && (
                <div className="flex-1 flex items-start justify-center pt-4">
                  <span
                    className="text-xs font-medium text-neutral-500"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    {config.label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Summary stats for the pipeline
 */
interface PipelineStatsProps {
  prospects: ProspectCardData[]
  className?: string
}

export function PipelineStats({ prospects, className }: PipelineStatsProps) {
  const totalTargetAmount = prospects.reduce((sum, p) => sum + p.target_ask_amount, 0)
  const avgReadiness = prospects.length > 0
    ? prospects.reduce((sum, p) => sum + p.readiness_score, 0) / prospects.length
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-neutral-600 mb-1">Total Prospects</p>
          <p className="text-2xl font-bold text-neutral-900">{prospects.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-neutral-600 mb-1">Total Target Amount</p>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(totalTargetAmount)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-neutral-600 mb-1">Avg Readiness</p>
          <p className="text-2xl font-bold text-neutral-900">
            {Math.round(avgReadiness)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
