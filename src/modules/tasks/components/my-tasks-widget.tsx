'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { CheckSquare, Calendar as CalendarIcon, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { completeTask } from '../actions/complete-task'
import type { TaskWithContact } from '../queries/get-tasks'

interface MyTasksWidgetProps {
  tasks: TaskWithContact[]
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
      label: `Overdue by ${daysOverdue}d`,
      isOverdue: true,
      isDueToday: false,
    }
  }

  return {
    label: `Due ${format(dueDate, 'MMM d')}`,
    isOverdue: false,
    isDueToday: false,
  }
}

export function MyTasksWidget({ tasks }: MyTasksWidgetProps) {
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

  const displayTasks = tasks.slice(0, 5)
  const hasMoreTasks = tasks.length > 5

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-neutral-900">My Tasks</CardTitle>
            {tasks.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                {tasks.length}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {displayTasks.length > 0 ? (
          <>
            <div className="divide-y divide-neutral-100">
              {displayTasks.map((task) => {
                const { label, isOverdue, isDueToday } = getDateLabel(task.due_date)
                const isCompleting = completingTaskId === task.id
                const contactName = task.contact
                  ? `${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim() || 'Unknown Contact'
                  : 'Unknown Contact'

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-neutral-50/50 transition-fast"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleCompleteTask(task.id)}
                      disabled={isCompleting}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/contacts/${task.contact_id}`}
                        className="text-sm font-medium text-neutral-900 hover:text-primary-600 block"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-0.5">{contactName}</p>
                      <div className="mt-1">
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
                )
              })}
            </div>
            {hasMoreTasks && (
              <div className="flex items-center justify-center gap-1 px-5 py-3 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-neutral-50/50 transition-fast border-t border-neutral-100">
                <Link href="/contacts" className="flex items-center gap-1">
                  View all {tasks.length} tasks
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center px-5">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-sm font-medium text-neutral-600">All caught up</p>
            <p className="text-xs text-neutral-400 mt-0.5">No tasks due today or overdue</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
