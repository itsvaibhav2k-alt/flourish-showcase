'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp } from 'lucide-react'
import { updateProspectStage } from '../actions/update-stage'
import { pipelineStages, type PipelineStage } from '../schemas/pipeline.schema'
import { useRouter } from 'next/navigation'

interface UpdateStageFormProps {
  prospectId: string
  currentStage: PipelineStage
}

export function UpdateStageForm({ prospectId, currentStage }: UpdateStageFormProps) {
  const router = useRouter()
  const [selectedStage, setSelectedStage] = React.useState<PipelineStage>(currentStage)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStage === currentStage) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateProspectStage({
        prospect_id: prospectId,
        new_stage: selectedStage,
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to update stage:', result.error)
        alert(result.error || 'Failed to update stage')
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      alert('An error occurred while updating the stage')
    } finally {
      setIsSubmitting(false)
    }
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-medium text-neutral-700">Update Stage</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as PipelineStage)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {capitalize(stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            disabled={isSubmitting || selectedStage === currentStage}
            className="w-full bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? 'Updating...' : 'Move to Stage'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
