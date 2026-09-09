'use client'

import { ReactNode } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FloraTooltipPosition } from './types'

interface FloraTooltipProps {
  children: ReactNode
  content: string | ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  position: FloraTooltipPosition
}

const positionToSide: Record<
  FloraTooltipPosition,
  'top' | 'right' | 'bottom' | 'left'
> = {
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
}

export function FloraTooltip({
  children,
  content,
  open,
  onOpenChange,
  position,
}: FloraTooltipProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={positionToSide[position]}
        sideOffset={8}
        className="max-w-xs text-sm"
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
          </div>
          <div className="text-neutral-700">{content}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
