'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar, UserCircle, Lightbulb, GripVertical } from 'lucide-react'
import type { PipelineProspect } from '@/modules/pipeline'
import { cn } from '@/lib/utils'

interface SortableProspectCardProps {
  prospect: PipelineProspect
  formatCurrency: (amount: number | null) => string
  stageBorderColor?: string
}

export function SortableProspectCard({ prospect, formatCurrency, stageBorderColor }: SortableProspectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fullName = `${prospect.contact.first_name} ${prospect.contact.last_name}`
  const initials = `${prospect.contact.first_name[0]}${prospect.contact.last_name[0]}`

  // Get next action recommendation based on readiness score
  const getNextActionRecommendation = () => {
    if (!prospect.readiness_score) return null

    if (prospect.readiness_score >= 80) {
      return {
        text: 'Ready to advance stage',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      }
    } else if (prospect.readiness_score >= 60) {
      return {
        text: 'Schedule 1-2 more touchpoints',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      }
    } else if (prospect.readiness_score >= 40) {
      return {
        text: 'Increase engagement frequency',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      }
    } else {
      return {
        text: 'Re-assess fit for pipeline',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      }
    }
  }

  const nextAction = getNextActionRecommendation()

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/pipeline/${prospect.id}`}>
        <div
          className={cn(
            // Base card styles - Linear inspired
            'bg-white border border-neutral-200 rounded-lg p-3 shadow-sm',
            // Left border for stage color
            'border-l-[3px]',
            stageBorderColor || 'border-l-neutral-300',
            // Hover effect
            'hover:shadow-md transition-all duration-200',
            // Cursor and group for hover states
            'cursor-pointer group',
            // Dragging state
            isDragging && 'opacity-50 shadow-lg'
          )}
        >
          <div className="space-y-2.5">
            {/* Drag Handle & Contact Info */}
            <div className="flex items-start gap-2">
              {/* Drag handle - visible on hover only */}
              <div
                {...attributes}
                {...listeners}
                className="mt-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4 text-neutral-300 hover:text-neutral-500" />
              </div>
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-medium text-xs flex-shrink-0">
                {initials}
              </div>
              {/* Name & Email */}
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

            {/* Target Amount & Readiness in a row */}
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

            {/* Next Action Recommendation - compact */}
            {nextAction && (
              <div className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-md', nextAction.bgColor)}>
                <Lightbulb className={cn('h-3 w-3 flex-shrink-0', nextAction.color)} />
                <p className={cn('text-[11px] font-medium leading-tight', nextAction.color)}>
                  {nextAction.text}
                </p>
              </div>
            )}

            {/* Next Move Date & Assigned To - bottom row */}
            {(prospect.next_move_date || prospect.assigned_user) && (
              <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-500">
                {prospect.next_move_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(prospect.next_move_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {prospect.assigned_user && (
                  <div className="flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    <span className="truncate max-w-[80px]">{prospect.assigned_user.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
