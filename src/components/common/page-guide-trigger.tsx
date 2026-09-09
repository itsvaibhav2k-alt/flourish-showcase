'use client'

import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePageGuide } from './page-guide-context'
import { cn } from '@/lib/utils'

interface PageGuideTriggerProps {
  pageKey: string
  className?: string
}

export function PageGuideTrigger({ pageKey, className }: PageGuideTriggerProps) {
  const { openGuide } = usePageGuide()

  const handleClick = () => {
    openGuide(pageKey)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={cn('h-9 w-9', className)}
            aria-label="How to use this page"
          >
            <HelpCircle className="h-5 w-5 text-neutral-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>How to use this page</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
