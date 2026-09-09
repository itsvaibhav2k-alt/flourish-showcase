'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReadinessMeter } from './readiness-meter'
import { MoveTimeline, type CultivationMove } from './move-timeline'
import { MoveLogger } from './move-logger'
import { cn } from '@/lib/utils'
import {
  DollarSign,
  Edit2,
  Save,
  X,
  Plus,
  ArrowRight,
  User,
  Target,
  TrendingUp
} from 'lucide-react'
import type { PipelineStage } from './pipeline-board'

interface ProspectDetailData {
  id: string
  contact_id: string
  contact_name: string
  contact_email?: string | null
  stage: PipelineStage
  target_ask_amount: number
  readiness_score: number
  notes?: string | null
  next_move_date?: string | null
  cultivation_moves: CultivationMove[]
}

interface ProspectDetailPanelProps {
  prospect: ProspectDetailData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
  className?: string
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  identification: 'Identification',
  qualification: 'Qualification',
  cultivation: 'Cultivation',
  solicitation: 'Solicitation',
  stewardship: 'Stewardship'
}

/**
 * Side panel for prospect details
 * - Shows all prospect info, readiness score
 * - Move timeline
 * - Form to update target amount, notes
 * - Button to advance stage
 */
export function ProspectDetailPanel({
  prospect,
  open,
  onOpenChange,
  onUpdate,
  className
}: ProspectDetailPanelProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'moves'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoggingMove, setIsLoggingMove] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  // Edit form state
  const [targetAmount, setTargetAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Reset form when prospect changes
  useState(() => {
    if (prospect) {
      setTargetAmount(prospect.target_ask_amount.toString())
      setNotes(prospect.notes || '')
      setIsEditing(false)
      setIsLoggingMove(false)
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = async () => {
    if (!prospect) return

    setIsSaving(true)
    try {
      const { updateProspect } = await import('../actions/update-prospect')

      const result = await updateProspect(prospect.id, {
        target_ask_amount: parseFloat(targetAmount),
        notes: notes || null
      })

      if (result.success) {
        setIsEditing(false)
        router.refresh()
        onUpdate?.()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdvanceStage = async () => {
    if (!prospect) return

    const stages: PipelineStage[] = [
      'identification',
      'qualification',
      'cultivation',
      'solicitation',
      'stewardship'
    ]
    const currentIndex = stages.indexOf(prospect.stage)
    if (currentIndex === stages.length - 1) return // Already at last stage

    const nextStage = stages[currentIndex + 1]

    setIsAdvancing(true)
    try {
      const { updateProspectStage } = await import('../actions/update-prospect-stage')

      const result = await updateProspectStage(prospect.id, nextStage)

      if (result.success) {
        router.refresh()
        onUpdate?.()
      }
    } finally {
      setIsAdvancing(false)
    }
  }

  const canAdvance = prospect && prospect.stage !== 'stewardship'

  if (!prospect) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('w-full sm:max-w-2xl overflow-y-auto', className)}>
        <SheetHeader className="space-y-3 pb-6 border-b border-neutral-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-neutral-400 shrink-0" />
                <SheetTitle className="text-xl truncate">
                  {prospect.contact_name}
                </SheetTitle>
              </div>
              {prospect.contact_email && (
                <p className="text-sm text-neutral-500 truncate">
                  {prospect.contact_email}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {STAGE_LABELS[prospect.stage]}
            </Badge>
          </div>
          <SheetDescription className="sr-only">
            View and edit prospect details
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'moves')} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="moves">
              Moves ({prospect.cultivation_moves.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Readiness Score */}
            <div className="flex justify-center py-4 border-b border-neutral-100">
              <ReadinessMeter
                score={prospect.readiness_score}
                label="Based on capacity, engagement, and cultivation"
                size={160}
              />
            </div>

            {/* Target Ask Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  Target Ask Amount
                </Label>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                      $
                    </span>
                    <Input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="h-11 pl-7"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTargetAmount(prospect.target_ask_amount.toString())
                        setNotes(prospect.notes || '')
                        setIsEditing(false)
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gradient-to-br from-primary-50 to-violet-50 border border-primary-100 p-4">
                  <p className="text-3xl font-bold text-primary-900">
                    {formatCurrency(prospect.target_ask_amount)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-neutral-400" />
                Notes
              </Label>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Strategy notes, background information, relationship details..."
                  className="min-h-[120px]"
                />
              ) : (
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 min-h-[100px]">
                  {prospect.notes ? (
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                      {prospect.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500 italic">
                      No notes added yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Advance Stage Button */}
            {canAdvance && !isEditing && (
              <div className="pt-4 border-t border-neutral-200">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleAdvanceStage}
                  disabled={isAdvancing}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Advance to {STAGE_LABELS[
                    ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship'][
                      ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship'].indexOf(prospect.stage) + 1
                    ] as PipelineStage
                  ]}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="moves" className="space-y-6 mt-6">
            {/* Log New Move Button */}
            {!isLoggingMove && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsLoggingMove(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log New Move
              </Button>
            )}

            {/* Move Logger Form */}
            {isLoggingMove && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                  Log Cultivation Move
                </h4>
                <MoveLogger
                  prospectId={prospect.id}
                  onSuccess={() => {
                    setIsLoggingMove(false)
                    router.refresh()
                    onUpdate?.()
                  }}
                  onCancel={() => setIsLoggingMove(false)}
                />
              </div>
            )}

            {/* Timeline */}
            <MoveTimeline moves={prospect.cultivation_moves} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
