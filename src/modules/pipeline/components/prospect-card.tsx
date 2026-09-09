'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CompactReadinessMeter } from './readiness-meter'
import { cn } from '@/lib/utils'
import { Calendar, DollarSign, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export interface ProspectCardData {
  id: string
  contact_id: string
  contact_name: string
  stage: 'identification' | 'qualification' | 'cultivation' | 'solicitation' | 'stewardship'
  target_ask_amount: number
  readiness_score: number
  next_move_date?: string | null
  last_move_type?: string | null
}

interface ProspectCardProps {
  prospect: ProspectCardData
  onClick?: () => void
  className?: string
  stageBorderColor?: string
}

/**
 * Card displayed in pipeline column - Linear inspired design
 * - Shows contact name, target ask amount, readiness score, next move date
 * - Color-coded stage via left border
 * - Subtle hover lift effect
 */
export function ProspectCard({
  prospect,
  onClick,
  className,
  stageBorderColor
}: ProspectCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div
      className={cn(
        // Base card styles - Linear inspired
        'bg-white border border-neutral-200 rounded-lg p-3 shadow-sm',
        // Left border for stage color
        'border-l-[3px]',
        stageBorderColor || 'border-l-neutral-300',
        // Hover effect - subtle lift
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        // Cursor
        'cursor-pointer group',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-2.5">
        {/* Contact Name */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-neutral-900 text-sm leading-tight flex-1">
            {prospect.contact_name}
          </h4>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-neutral-300 transition-all shrink-0',
              isHovered && 'text-neutral-500 translate-x-0.5'
            )}
          />
        </div>

        {/* Target Ask Amount & Readiness in a row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-700">
              {formatCurrency(prospect.target_ask_amount)}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-medium h-5 px-1.5',
              prospect.readiness_score >= 80
                ? 'bg-green-50 text-green-700'
                : prospect.readiness_score >= 50
                ? 'bg-amber-50 text-amber-700'
                : 'bg-neutral-100 text-neutral-600'
            )}
          >
            {prospect.readiness_score}%
          </Badge>
        </div>

        {/* Compact Readiness Meter */}
        <CompactReadinessMeter score={prospect.readiness_score} />

        {/* Next Move Date & Last Move */}
        {(prospect.next_move_date || prospect.last_move_type) && (
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100">
            {prospect.next_move_date && (
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(prospect.next_move_date), 'MMM d')}</span>
              </div>
            )}
            {prospect.last_move_type && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-neutral-100">
                {prospect.last_move_type}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Empty state placeholder for columns with no prospects
 */
export function EmptyProspectCard({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center">
      <p className="text-xs text-neutral-500">
        {message || 'No prospects in this stage'}
      </p>
    </div>
  )
}
