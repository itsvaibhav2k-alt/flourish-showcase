'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Filter, Plus, Bookmark, Trash2 } from 'lucide-react'
import { SaveSegmentDialog } from './save-segment-dialog'
import { deleteSegment } from '../actions/delete-segment'
import type { Segment, EntityType, SegmentFilter } from '../schemas/segment.schema'

interface SegmentDropdownProps {
  entityType: EntityType
  segments: Segment[]
  currentFilters?: SegmentFilter[]
  onSegmentSelect?: (segment: Segment) => void
}

export function SegmentDropdown({
  entityType,
  segments,
  currentFilters = [],
  onSegmentSelect,
}: SegmentDropdownProps) {
  const router = useRouter()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const hasActiveFilters = currentFilters.length > 0

  const handleSegmentSelect = (segment: Segment) => {
    if (onSegmentSelect) {
      onSegmentSelect(segment)
    }
  }

  const handleDeleteSegment = async (segmentId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this segment?')) {
      return
    }

    setIsDeleting(segmentId)

    try {
      const result = await deleteSegment(segmentId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete segment')
      }
    } catch (err) {
      console.error('Error deleting segment:', err)
      alert('An unexpected error occurred')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-primary-200 hover:bg-primary-50 hover:border-primary-300"
          >
            <Bookmark className="h-4 w-4 text-primary-600" />
            <span>Segments</span>
            {segments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                {segments.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {segments.length > 0 ? (
            <>
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-neutral-500">
                Saved Segments ({segments.length})
              </DropdownMenuLabel>
              {segments.map((segment) => (
                <DropdownMenuItem
                  key={segment.id}
                  onClick={() => handleSegmentSelect(segment)}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Filter className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    <span className="truncate font-medium">{segment.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSegment(segment.id, e)}
                    disabled={isDeleting === segment.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600 disabled:opacity-50"
                    title="Delete segment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-neutral-500">
                No Saved Segments
              </DropdownMenuLabel>
              <div className="px-2 py-3 text-xs text-neutral-500">
                Apply filters and save them as segments for quick access
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasActiveFilters}
            className="gap-2 text-primary-600 font-medium"
          >
            <Plus className="h-4 w-4" />
            Save Current Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveSegmentDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        entityType={entityType}
        filters={currentFilters}
      />
    </>
  )
}
