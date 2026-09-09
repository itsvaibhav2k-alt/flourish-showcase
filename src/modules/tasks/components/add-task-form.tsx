'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { createTask } from '../actions/create-task'

interface AddTaskFormProps {
  contactId: string
  onSuccess?: () => void
}

export function AddTaskForm({ contactId, onSuccess }: AddTaskFormProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [dueDate, setDueDate] = React.useState<Date>()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createTask({
        contactId,
        title,
        description: description || undefined,
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      })

      if (result.success) {
        setTitle('')
        setDescription('')
        setDueDate(undefined)
        router.refresh()
        onSuccess?.()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="mt-1.5"
          required
        />
      </div>

      <div>
        <Label htmlFor="task-description">Description (Optional)</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this task..."
          className="mt-1.5 min-h-[80px]"
        />
      </div>

      <div>
        <Label>Due Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal mt-1.5',
                !dueDate && 'text-neutral-500'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
