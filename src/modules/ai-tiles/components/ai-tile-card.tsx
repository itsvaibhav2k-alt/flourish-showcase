'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface AITileCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  lastUpdated?: Date
  onRefresh?: () => void
  className?: string
}

/**
 * Base AI Tile Card Component
 *
 * Provides consistent styling for all AI tiles:
 * - Shimmer loading state with gradient animation
 * - AI sparkle indicator
 * - Optional refresh functionality
 */
export function AITileCard({
  title,
  icon,
  children,
  isLoading = false,
  lastUpdated,
  onRefresh,
  className,
}: AITileCardProps) {
  return (
    <div className="relative">
      <Card
        className={cn(
          'shadow-card border-neutral-200/60 bg-white overflow-hidden relative transition-shadow duration-200',
          'hover:shadow-card-hover',
          isLoading && 'pointer-events-none',
          className
        )}
      >
        {/* Shimmer loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        )}

        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Icon container */}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <div className="text-white [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
              </div>

              {/* Title and AI indicator */}
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  {title}
                </CardTitle>
                <div>
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                </div>
              </div>
            </div>

            {/* Refresh button and last updated */}
            <div className="flex items-center gap-2">
              {lastUpdated && !isLoading && (
                <span className="text-xs text-neutral-400">
                  {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600"
                  title="Refresh insights"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pb-7">
          {children}
        </CardContent>

        {/* AI branding footer */}
        <div className="absolute bottom-2.5 right-4">
          <div className="flex items-center gap-1 text-[10px] text-neutral-300 font-medium tracking-wide">
            <div className="h-1 w-1 rounded-full bg-primary-400/50" />
            <span>AI</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
