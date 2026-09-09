'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageSquare } from 'lucide-react'
import { logCultivationMove } from '../actions/log-cultivation-move'
import { moveTypes, type MoveType } from '../schemas/pipeline.schema'
import { useRouter } from 'next/navigation'

interface LogMoveFormProps {
  prospectId: string
}

export function LogMoveForm({ prospectId }: LogMoveFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [moveType, setMoveType] = React.useState<MoveType>('call')
  const [moveDate, setMoveDate] = React.useState(
    new Date().toISOString().split('T')[0]
  )
  const [description, setDescription] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      alert('Please enter a description')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await logCultivationMove({
        prospect_id: prospectId,
        move_type: moveType,
        move_date: moveDate,
        description: description.trim(),
      })

      if (result.success) {
        // Reset form
        setDescription('')
        setMoveDate(new Date().toISOString().split('T')[0])
        setMoveType('call')
        router.refresh()
      } else {
        console.error('Failed to log move:', result.error)
        alert(result.error || 'Failed to log move')
      }
    } catch (error) {
      console.error('Error logging move:', error)
      alert('An error occurred while logging the move')
    } finally {
      setIsSubmitting(false)
    }
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-medium text-neutral-700">Log Move</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-neutral-700 mb-1.5 block">
              Move Type
            </label>
            <Select value={moveType} onValueChange={(value) => setMoveType(value as MoveType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {moveTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {capitalize(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 mb-1.5 block">
              Date
            </label>
            <Input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 mb-1.5 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the interaction..."
              rows={3}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? 'Logging...' : 'Log Move'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
