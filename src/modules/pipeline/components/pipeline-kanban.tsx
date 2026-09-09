'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import type { PipelineProspect, PipelineStage } from '@/modules/pipeline'
import { updateProspectStage } from '@/modules/pipeline/actions/update-stage'
import { useRouter } from 'next/navigation'
import { SortableProspectCard } from './sortable-prospect-card'
import { cn } from '@/lib/utils'

interface PipelineKanbanProps {
  prospectsByStage: Record<PipelineStage, PipelineProspect[]>
}

const STAGE_CONFIG = {
  identification: {
    name: 'Identification',
    description: 'Identifying potential major donors',
    borderColor: 'border-l-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  qualification: {
    name: 'Qualification',
    description: 'Qualifying capacity and interest',
    borderColor: 'border-l-violet-500',
    badgeBg: 'bg-violet-50 text-violet-700',
    dotColor: 'bg-violet-500',
  },
  cultivation: {
    name: 'Cultivation',
    description: 'Building relationships',
    borderColor: 'border-l-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700',
    dotColor: 'bg-amber-500',
  },
  solicitation: {
    name: 'Solicitation',
    description: 'Making the ask',
    borderColor: 'border-l-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  stewardship: {
    name: 'Stewardship',
    description: 'Thanking and stewarding',
    borderColor: 'border-l-rose-500',
    badgeBg: 'bg-rose-50 text-rose-700',
    dotColor: 'bg-rose-500',
  },
} as const

const stages: PipelineStage[] = ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship']

export function PipelineKanban({ prospectsByStage: initialProspectsByStage }: PipelineKanbanProps) {
  const router = useRouter()
  const [prospectsByStage, setProspectsByStage] = useState(initialProspectsByStage)
  const [activeProspect, setActiveProspect] = useState<PipelineProspect | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [collapsedColumns, setCollapsedColumns] = useState<Record<PipelineStage, boolean>>({
    identification: false,
    qualification: false,
    cultivation: false,
    solicitation: false,
    stewardship: false,
  })

  const toggleColumnCollapse = (stage: PipelineStage) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [stage]: !prev[stage],
    }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const prospectId = active.id as string

    // Find the prospect across all stages
    for (const stage of stages) {
      const prospect = prospectsByStage[stage].find((p) => p.id === prospectId)
      if (prospect) {
        setActiveProspect(prospect)
        break
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProspect(null)

    if (!over) return

    const prospectId = active.id as string
    const newStage = over.id as PipelineStage

    // Find current stage
    let currentStage: PipelineStage | null = null
    for (const stage of stages) {
      if (prospectsByStage[stage].find((p) => p.id === prospectId)) {
        currentStage = stage
        break
      }
    }

    if (!currentStage || currentStage === newStage) return

    // Optimistically update UI
    const prospect = prospectsByStage[currentStage].find((p) => p.id === prospectId)
    if (!prospect) return

    const newProspectsByStage = { ...prospectsByStage }
    newProspectsByStage[currentStage] = prospectsByStage[currentStage].filter((p) => p.id !== prospectId)
    newProspectsByStage[newStage] = [...prospectsByStage[newStage], { ...prospect, stage: newStage }]
    setProspectsByStage(newProspectsByStage)

    // Update on server
    setIsUpdating(true)
    try {
      const result = await updateProspectStage({
        prospect_id: prospectId,
        new_stage: newStage,
        notes: `Moved from ${currentStage} to ${newStage} via drag-and-drop`,
      })

      if (result.success) {
        router.refresh()
      } else {
        // Revert on error
        setProspectsByStage(initialProspectsByStage)
        console.error('Failed to update stage:', result.error)
      }
    } catch (error) {
      // Revert on error
      setProspectsByStage(initialProspectsByStage)
      console.error('Error updating stage:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-3">
        {stages.map((stage) => {
          const prospects = prospectsByStage[stage] || []
          const config = STAGE_CONFIG[stage]
          const isCollapsed = collapsedColumns[stage]

          return (
            <SortableContext key={stage} items={prospects.map((p) => p.id)} id={stage}>
              <div
                className={cn(
                  "flex flex-col rounded-lg bg-neutral-50/80 border border-neutral-200/60",
                  isCollapsed ? "w-12" : "min-w-[280px]"
                )}
              >
                {/* Column Header - Linear inspired */}
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 bg-neutral-100/80 rounded-t-lg border-b border-neutral-200/60",
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
                        {config.name}
                      </h3>
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      "bg-neutral-200 text-neutral-600",
                      isCollapsed && "rotate-0"
                    )}
                  >
                    {prospects.length}
                  </span>
                </div>

                {/* Column Content */}
                {!isCollapsed && (
                  <>
                    {/* Prospect Cards */}
                    <div className="flex-1 p-2 space-y-2 min-h-[500px] max-h-[calc(100vh-320px)] overflow-y-auto">
                      {prospects.length > 0 ? (
                        prospects.map((prospect) => (
                          <SortableProspectCard
                            key={prospect.id}
                            prospect={prospect}
                            formatCurrency={formatCurrency}
                            stageBorderColor={config.borderColor}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-white/50 p-6 text-center">
                          <p className="text-xs text-neutral-400">
                            No prospects in this stage
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Drag cards here or add new
                          </p>
                        </div>
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
                      className="text-xs font-medium text-neutral-500 writing-mode-vertical"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                      {config.name}
                    </span>
                  </div>
                )}
              </div>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeProspect ? (
          <ProspectCardOverlay prospect={activeProspect} formatCurrency={formatCurrency} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function ProspectCardOverlay({
  prospect,
  formatCurrency,
}: {
  prospect: PipelineProspect
  formatCurrency: (amount: number | null) => string
}) {
  const fullName = `${prospect.contact.first_name} ${prospect.contact.last_name}`
  const initials = `${prospect.contact.first_name[0]}${prospect.contact.last_name[0]}`
  const stageConfig = STAGE_CONFIG[prospect.stage]

  return (
    <div
      className={cn(
        'bg-white border border-neutral-200 rounded-lg p-3 shadow-lg w-[280px]',
        'border-l-[3px]',
        stageConfig?.borderColor || 'border-l-neutral-300'
      )}
    >
      <div className="space-y-2.5">
        {/* Contact Info */}
        <div className="flex items-start gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-medium text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-neutral-900 text-sm truncate leading-tight">
              {fullName}
            </p>
            {prospect.contact.email && (
              <p className="text-xs text-neutral-400 truncate">
                {prospect.contact.email}
              </p>
            )}
          </div>
        </div>

        {/* Target Amount & Readiness */}
        <div className="flex items-center justify-between gap-2">
          {prospect.target_ask_amount && (
            <span className="text-xs font-medium text-neutral-700">
              {formatCurrency(prospect.target_ask_amount)}
            </span>
          )}
          {prospect.readiness_score !== null && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-medium h-5 px-1.5',
                prospect.readiness_score >= 80
                  ? 'bg-green-50 text-green-700'
                  : prospect.readiness_score >= 60
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-neutral-100 text-neutral-600'
              )}
            >
              {prospect.readiness_score}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
