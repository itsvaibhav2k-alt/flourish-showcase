'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export interface SegmentOption {
  id: string
  name: string
  count: number
}

interface SegmentFilterPillsProps {
  segments: SegmentOption[]
  activeSegment: string | null
  onSegmentChange?: (segmentId: string | null) => void
}

/**
 * Horizontal scrollable segment filter pills
 * Displays segment options with counts and active state
 * Mobile-friendly with smooth scroll behavior
 */
export function SegmentFilterPills({
  segments,
  activeSegment,
  onSegmentChange,
}: SegmentFilterPillsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSegmentClick = (segmentId: string | null) => {
    // Call the provided callback if it exists
    if (onSegmentChange) {
      onSegmentChange(segmentId)
    }

    // Update URL query params
    const params = new URLSearchParams(searchParams?.toString())
    if (segmentId && segmentId !== 'all') {
      params.set('segment', segmentId)
    } else {
      params.delete('segment')
    }

    const queryString = params.toString()
    router.push(`/donors${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2 min-w-min">
        {/* All segments pill */}
        <button
          onClick={() => handleSegmentClick(null)}
          className={`
            flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full
            text-sm font-medium transition-all duration-200
            ${
              !activeSegment || activeSegment === 'all'
                ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
            }
          `}
        >
          <span>All Donors</span>
          <span
            className={`
              px-2 py-0.5 rounded-full text-xs font-semibold
              ${
                !activeSegment || activeSegment === 'all'
                  ? 'bg-violet-200 text-violet-800'
                  : 'bg-neutral-200 text-neutral-700'
              }
            `}
          >
            {segments.reduce((sum, seg) => sum + seg.count, 0)}
          </span>
        </button>

        {/* Individual segment pills */}
        {segments.map((segment) => {
          const isActive = activeSegment === segment.id

          // Segment-specific colors
          const colorClasses = {
            active: 'bg-green-100 text-green-700 border-green-300',
            new: 'bg-teal-100 text-teal-700 border-teal-300',
            lapsed: 'bg-amber-100 text-amber-700 border-amber-300',
            major: 'bg-rose-100 text-rose-700 border-rose-300',
          }

          const activeColorClass = colorClasses[segment.id as keyof typeof colorClasses] || 'bg-violet-100 text-violet-700 border-violet-300'

          const badgeColors = {
            active: 'bg-green-200 text-green-800',
            new: 'bg-teal-200 text-teal-800',
            lapsed: 'bg-amber-200 text-amber-800',
            major: 'bg-rose-200 text-rose-800',
          }

          const activeBadgeColor = badgeColors[segment.id as keyof typeof badgeColors] || 'bg-violet-200 text-violet-800'

          return (
            <button
              key={segment.id}
              onClick={() => handleSegmentClick(segment.id)}
              className={`
                flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full
                text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? `${activeColorClass} border-2`
                    : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
                }
              `}
            >
              <span>{segment.name}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${isActive ? activeBadgeColor : 'bg-neutral-200 text-neutral-700'}
                `}
              >
                {segment.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Custom CSS to hide scrollbar (add to globals.css if needed)
// .scrollbar-hide::-webkit-scrollbar {
//   display: none;
// }
// .scrollbar-hide {
//   -ms-overflow-style: none;
//   scrollbar-width: none;
// }
