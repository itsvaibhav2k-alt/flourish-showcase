'use client'

import * as React from 'react'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { Plus, CheckSquare, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddTaskForm } from './add-task-form'
import { completeTask } from '../actions/complete-task'
import type { ContactTask } from '../schemas/task.schema'

interface TasksListProps {
  tasks: ContactTask[]
  contactId: string
}

function getDateLabel(dateString: string | null): {
  label: string
  isOverdue: boolean
  isDueToday: boolean
} {
  if (!dateString) {
    return { label: 'No due date', isOverdue: false, isDueToday: false }
  }

  const dueDate = new Date(dateString)
  const isDueToday = isToday(dueDate)
  const isOverdue = isPast(dueDate) && !isDueToday

  if (isDueToday) {
    return { label: 'Due today', isOverdue: false, isDueToday: true }
  }

  if (isOverdue) {
    const daysOverdue = Math.abs(differenceInDays(new Date(), dueDate))
    return {
      label: `Overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isDueToday: false,
    }
  }

  return {
    label: `Due ${format(dueDate, 'MMM d, yyyy')}`,
    isOverdue: false,
    isDueToday: false,
  }
}

export function TasksList({ tasks, contactId }: TasksListProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null)
  const router = useRouter()

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId)
    try {
      const result = await completeTask({ taskId })
      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to complete task:', result.error)
      }
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setCompletingTaskId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Tasks</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
              <DialogDescription>
                Create a new task for this contact.
              </DialogDescription>
            </DialogHeader>
            <AddTaskForm
              contactId={contactId}
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No open tasks</p>
            <p className="text-xs text-neutral-400 mt-1">
              Create tasks to track follow-ups and action items
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const { label, isOverdue, isDueToday } = getDateLabel(task.due_date)
            const isCompleting = completingTaskId === task.id

            return (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleCompleteTask(task.id)}
                      disabled={isCompleting}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-neutral-600 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            {label}
                          </span>
                        ) : isDueToday ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <CalendarIcon className="h-3 w-3" />
                            {label}
                          </span>
                        ) : task.due_date ? (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                            <CalendarIcon className="h-3 w-3" />
                            {label}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">{label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
