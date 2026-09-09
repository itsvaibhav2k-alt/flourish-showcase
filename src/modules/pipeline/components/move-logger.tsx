'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Loader2, Calendar, FileText, Target, TrendingUp } from 'lucide-react'

export type MoveType =
  | 'initial_contact'
  | 'meeting'
  | 'phone_call'
  | 'email'
  | 'event_attendance'
  | 'site_visit'
  | 'proposal_sent'
  | 'ask_made'
  | 'follow_up'
  | 'stewardship_contact'

const MOVE_TYPES: Record<MoveType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  initial_contact: { label: 'Initial Contact', icon: Target },
  meeting: { label: 'In-Person Meeting', icon: Target },
  phone_call: { label: 'Phone Call', icon: Target },
  email: { label: 'Email Communication', icon: FileText },
  event_attendance: { label: 'Event Attendance', icon: Target },
  site_visit: { label: 'Site Visit', icon: Target },
  proposal_sent: { label: 'Proposal Sent', icon: FileText },
  ask_made: { label: 'Ask Made', icon: TrendingUp },
  follow_up: { label: 'Follow-up', icon: Target },
  stewardship_contact: { label: 'Stewardship Contact', icon: Target }
}

interface MoveLoggerProps {
  prospectId: string
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

/**
 * Form to log a new cultivation move
 * - Fields: move_type, move_date, description, outcome, next_step
 * - Submit calls log-move action
 * - Simple state-based form (no react-hook-form needed for this simple form)
 */
export function MoveLogger({
  prospectId,
  onSuccess,
  onCancel,
  className
}: MoveLoggerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [moveType, setMoveType] = useState<string>('')
  const [moveDate, setMoveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [description, setDescription] = useState<string>('')
  const [outcome, setOutcome] = useState<string>('')
  const [nextStep, setNextStep] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!moveType) {
      setError('Please select a move type')
      setIsLoading(false)
      return
    }

    if (!moveDate) {
      setError('Please select a date')
      setIsLoading(false)
      return
    }

    try {
      // Import the action dynamically
      const { logCultivationMove } = await import('../actions/log-cultivation-move')

      const result = await logCultivationMove({
        prospect_id: prospectId,
        move_type: moveType as MoveType,
        move_date: moveDate,
        description: description || null,
        outcome: outcome || null,
        next_step: nextStep || null
      })

      if (result.success) {
        router.refresh()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || 'Failed to log move')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">Error</p>
          <p className="text-sm text-rose-700 mt-1">{error}</p>
        </div>
      )}

      {/* Move Type */}
      <div className="space-y-2">
        <Label htmlFor="moveType" className="text-sm font-medium text-neutral-700">
          Move Type <span className="text-rose-500">*</span>
        </Label>
        <Select value={moveType} onValueChange={setMoveType}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select move type" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MOVE_TYPES) as MoveType[]).map((type) => {
              const Icon = MOVE_TYPES[type].icon
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-neutral-400" />
                    {MOVE_TYPES[type].label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Move Date */}
      <div className="space-y-2">
        <Label htmlFor="moveDate" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          Date <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="moveDate"
          type="date"
          value={moveDate}
          onChange={(e) => setMoveDate(e.target.value)}
          className="h-11"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-neutral-400" />
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened during this interaction?"
          className="min-h-[100px]"
        />
        <p className="text-xs text-neutral-500">
          Describe what was discussed or what occurred
        </p>
      </div>

      {/* Outcome */}
      <div className="space-y-2">
        <Label htmlFor="outcome" className="text-sm font-medium text-neutral-700">
          Outcome
        </Label>
        <Textarea
          id="outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="What was the result or key takeaway?"
          className="min-h-[80px]"
        />
        <p className="text-xs text-neutral-500">
          Key results, commitments, or insights gained
        </p>
      </div>

      {/* Next Step */}
      <div className="space-y-2">
        <Label htmlFor="nextStep" className="text-sm font-medium text-neutral-700">
          Next Step
        </Label>
        <Input
          id="nextStep"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          placeholder="What should happen next?"
          className="h-11"
        />
        <p className="text-xs text-neutral-500">
          The planned follow-up or next action
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !moveType || !moveDate}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging...
            </>
          ) : (
            'Log Move'
          )}
        </Button>
      </div>
    </form>
  )
}
