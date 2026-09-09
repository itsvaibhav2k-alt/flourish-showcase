'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Loader2, TrendingUp, DollarSign } from 'lucide-react'
import type { PipelineStage } from '../schemas/pipeline.schema'

interface AddToPipelineButtonProps {
  contactId: string
  contactName?: string
  isInPipeline?: boolean
  prospectId?: string | null
  variant?: 'default' | 'outline' | 'ghost' | 'primary'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

const STAGE_OPTIONS: { value: PipelineStage; label: string; description: string }[] = [
  {
    value: 'identification',
    label: 'Identification',
    description: 'Just identified as potential major donor'
  },
  {
    value: 'qualification',
    label: 'Qualification',
    description: 'Qualifying capacity and interest'
  },
  {
    value: 'cultivation',
    label: 'Cultivation',
    description: 'Actively building relationship'
  },
  {
    value: 'solicitation',
    label: 'Solicitation',
    description: 'Ready to make the ask'
  },
  {
    value: 'stewardship',
    label: 'Stewardship',
    description: 'Post-gift relationship management'
  }
]

/**
 * Button to add a contact to pipeline
 * - Opens modal to select initial stage and target amount
 * - Used on contact detail page
 * - Calls add-to-pipeline action
 */
export function AddToPipelineButton({
  contactId,
  contactName,
  isInPipeline = false,
  prospectId,
  variant = 'primary',
  size = 'default',
  className
}: AddToPipelineButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [stage, setStage] = useState<PipelineStage>('identification')
  const [targetAmount, setTargetAmount] = useState<string>('25000')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please enter a valid target amount')
      setIsLoading(false)
      return
    }

    try {
      const { addToPipeline } = await import('../actions/add-to-pipeline')

      const result = await addToPipeline({
        contact_id: contactId,
        stage,
        target_ask_amount: parseFloat(targetAmount)
      })

      if (result.success) {
        setOpen(false)
        router.refresh()
        // Reset form
        setStage('identification')
        setTargetAmount('25000')
      } else {
        setError(result.error || 'Failed to add to pipeline')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // If already in pipeline, show link to view
  if (isInPipeline && prospectId) {
    return (
      <Button variant="outline" size={size} className={className} asChild>
        <a href={`/pipeline/${prospectId}`}>
          <TrendingUp className="h-4 w-4 mr-2" />
          View in Pipeline
        </a>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Add to Major Gift Pipeline
            </DialogTitle>
            <DialogDescription>
              {contactName
                ? `Add ${contactName} to your major gift pipeline`
                : 'Add this contact to your major gift pipeline'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-800">Error</p>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            )}

            {/* Initial Stage */}
            <div className="space-y-3">
              <Label htmlFor="stage" className="text-sm font-medium text-neutral-900">
                Initial Stage
              </Label>
              <Select value={stage} onValueChange={(v) => setStage(v as PipelineStage)}>
                <SelectTrigger id="stage" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-neutral-500">
                          {option.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                Select the stage that best matches where this prospect is in your cultivation process
              </p>
            </div>

            {/* Target Ask Amount */}
            <div className="space-y-3">
              <Label htmlFor="targetAmount" className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                Target Ask Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  $
                </span>
                <Input
                  id="targetAmount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="h-11 pl-7 text-lg font-semibold"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500">
                The amount you plan to ask this prospect to donate (can be updated later)
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutral-600 w-full mb-1">Quick amounts:</span>
              {[10000, 25000, 50000, 100000, 250000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetAmount(amount.toString())}
                  className="text-xs"
                >
                  ${(amount / 1000).toFixed(0)}K
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Pipeline
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Compact version for tables and lists
 */
export function AddToPipelineIconButton({
  contactId,
  className
}: {
  contactId: string
  className?: string
}) {
  return (
    <AddToPipelineButton
      contactId={contactId}
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 p-0', className)}
    />
  )
}
