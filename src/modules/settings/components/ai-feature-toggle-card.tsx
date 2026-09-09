'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloraTooltipContent {
  title: string
  content: string
  tip?: string
}

interface AIFeatureToggleCardProps {
  id: string
  title: string
  description: string
  example?: string
  enabled: boolean
  onToggle: (enabled: boolean) => Promise<void>
  isLoading?: boolean
  floraTooltip: FloraTooltipContent
  icon: LucideIcon
  iconBgClass?: string
  disabled?: boolean
  badge?: {
    text: string
    variant: 'success' | 'warning' | 'info' | 'muted'
  }
}

export function AIFeatureToggleCard({
  id,
  title,
  description,
  example,
  enabled,
  onToggle,
  isLoading = false,
  floraTooltip,
  icon: Icon,
  iconBgClass = 'bg-primary-50',
  disabled = false,
  badge,
}: AIFeatureToggleCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const badgeVariants = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    muted: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  }

  return (
    <Card className="shadow-card border-neutral-100">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBgClass
          )}>
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', badgeVariants[badge.variant])}
                >
                  {badge.text}
                </Badge>
              )}
              {mounted ? (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                      aria-label={`Learn more about ${title}`}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-80 p-0 overflow-hidden"
                  >
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
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-neutral-900 text-sm mb-1">
                          {floraTooltip.title}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          {floraTooltip.content}
                        </p>
                      </div>
                      {floraTooltip.tip && (
                        <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                          <p className="text-xs text-amber-800">
                            <span className="font-medium">Pro tip:</span> {floraTooltip.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-neutral-400"
                  aria-label={`Learn more about ${title}`}
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription className="text-neutral-500 mt-1">
              {description}
            </CardDescription>
          </div>
          <Switch
            id={id}
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={isLoading || disabled}
            className="flex-shrink-0"
          />
        </div>
      </CardHeader>
      {example && (
        <CardContent className="pt-0">
          <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <p className="text-xs font-medium text-neutral-700 mb-1">Example:</p>
            <p className="text-xs text-neutral-600">{example}</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
