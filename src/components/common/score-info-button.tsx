'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Info, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoreDefinition } from '@/lib/content/score-definitions'

interface ScoreInfoButtonProps {
  scoreKey: string
  value?: number
  size?: 'sm' | 'md'
  scoreDefinitions: Record<string, ScoreDefinition>
}

export function ScoreInfoButton({
  scoreKey,
  value,
  size = 'md',
  scoreDefinitions,
}: ScoreInfoButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCalculationOpen, setIsCalculationOpen] = React.useState(false)

  const definition = scoreDefinitions[scoreKey]

  if (!definition) {
    console.warn(`Score definition not found for key: ${scoreKey}`)
    return null
  }

  // Determine which range the value falls into
  const getCurrentRange = () => {
    if (value === undefined || !definition.ranges) return null

    return definition.ranges.find(
      (range) => value >= range.min && value <= range.max
    )
  }

  const currentRange = getCurrentRange()

  // Get color classes based on range label
  const getRangeColorClasses = (label: string) => {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('excellent') || lowerLabel.includes('high')) {
      return 'bg-green-50 text-green-700 border-green-200'
    }
    if (lowerLabel.includes('good') || lowerLabel.includes('medium')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    if (lowerLabel.includes('low') || lowerLabel.includes('at risk') || lowerLabel.includes('poor')) {
      return 'bg-red-50 text-red-700 border-red-200'
    }
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }

  const buttonSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
  }

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-neutral-400 hover:text-primary-600 hover:bg-primary-50',
            buttonSizeClasses[size]
          )}
          aria-label={`Learn more about ${definition.title}`}
        >
          <Info className={iconSizeClasses[size]} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 overflow-hidden"
      >
        {/* Flora Header */}
        <div className="bg-gradient-to-r from-primary-50 to-violet-50 px-4 py-3 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <Image
              src="/flora-explaining.png"
              alt="Flora mascot"
              width={40}
              height={60}
              className="object-contain"
            />
            <p className="font-medium text-primary-900 text-sm">Flora says...</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h4 className="font-medium text-neutral-900 text-sm mb-1">
              {definition.title}
            </h4>
            <p className="text-sm text-neutral-600">
              {definition.description}
            </p>
          </div>

          {/* Current Value Range (if value provided) */}
          {currentRange && (
            <div className={cn(
              'p-3 rounded-md border',
              getRangeColorClasses(currentRange.label)
            )}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Current: {value}</p>
                <p className="text-xs font-medium">{currentRange.label}</p>
              </div>
              {currentRange.description && (
                <p className="text-xs mt-1 opacity-90">
                  {currentRange.description}
                </p>
              )}
            </div>
          )}

          {/* How it's calculated (expandable) */}
          {definition.calculation && (
            <Collapsible
              open={isCalculationOpen}
              onOpenChange={setIsCalculationOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between px-0 hover:bg-transparent text-neutral-700 hover:text-neutral-900"
                >
                  <span className="text-xs font-medium">How it&apos;s calculated</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isCalculationOpen && 'transform rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                  <p className="text-xs text-neutral-600 whitespace-pre-line">
                    {definition.calculation}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* All Ranges (if defined) */}
          {definition.ranges && definition.ranges.length > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-xs font-medium text-neutral-700 mb-2">
                Score Ranges:
              </p>
              <div className="space-y-1.5">
                {definition.ranges.map((range, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 rounded text-xs border',
                      currentRange === range
                        ? getRangeColorClasses(range.label)
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                    )}
                  >
                    <span className="font-medium">{range.label}</span>
                    <span className="text-xs opacity-75">
                      {range.min}–{range.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
