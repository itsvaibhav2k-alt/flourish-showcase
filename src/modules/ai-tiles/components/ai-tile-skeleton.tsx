'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AITileSkeletonProps {
  className?: string
}

/**
 * AI Tile Loading Skeleton
 *
 * Provides a shimmer loading state that matches the layout of actual tiles.
 * Uses CSS animations for smooth, performant shimmer effect.
 */
export function AITileSkeleton({ className }: AITileSkeletonProps) {
  return (
    <Card className={cn('shadow-card border-neutral-200/60 bg-white overflow-hidden relative', className)}>
      {/* Shimmer gradient animation */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-neutral-100/60 to-transparent" />

      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Icon skeleton */}
            <div className="h-8 w-8 rounded-lg bg-neutral-100 animate-pulse" />

            {/* Title skeleton */}
            <div className="h-5 w-32 bg-neutral-100 rounded animate-pulse" />
          </div>

          {/* Action skeleton */}
          <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Content skeletons */}
        <div className="space-y-2">
          <div className="h-4 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-neutral-100 rounded animate-pulse w-4/6" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-neutral-100 rounded animate-pulse" />
          <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Add shimmer keyframe animation to globals.css if not already present:
 *
 * @keyframes shimmer {
 *   100% {
 *     transform: translateX(100%);
 *   }
 * }
 */
