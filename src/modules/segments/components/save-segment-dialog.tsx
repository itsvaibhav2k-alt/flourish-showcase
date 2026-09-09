'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSegment } from '../actions/save-segment'
import type { EntityType, SegmentFilter } from '../schemas/segment.schema'

interface SaveSegmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  filters: SegmentFilter[]
}

export function SaveSegmentDialog({
  open,
  onOpenChange,
  entityType,
  filters,
}: SaveSegmentDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter a segment name')
      return
    }

    if (filters.length === 0) {
      setError('Cannot save a segment with no filters')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createSegment({
        name: name.trim(),
        entityType,
        filters,
      })

      if (result.success) {
        setName('')
        onOpenChange(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to save segment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error saving segment:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setName('')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save Segment</DialogTitle>
            <DialogDescription>
              Give this segment a name so you can quickly access these filters later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment Name</Label>
              <Input
                id="segment-name"
                placeholder="e.g., High-value donors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            {filters.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-medium text-neutral-500 uppercase">
                  Active Filters ({filters.length})
                </p>
                <div className="text-sm text-neutral-600 space-y-0.5">
                  {filters.slice(0, 3).map((filter, idx) => (
                    <div key={idx} className="text-xs">
                      {filter.field} {filter.operator} {filter.value ?? ''}
                    </div>
                  ))}
                  {filters.length > 3 && (
                    <div className="text-xs text-neutral-400">
                      +{filters.length - 3} more filters
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
