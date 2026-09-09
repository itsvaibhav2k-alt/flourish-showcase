'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SegmentDropdown } from './segment-dropdown'
import type { Segment, SegmentFilter } from '../schemas/segment.schema'

interface ContactsSegmentBarProps {
  segments: Segment[]
}

/**
 * ContactsSegmentBar - Integration component for the contacts page
 * Handles applying segment filters to the contacts page URL
 */
export function ContactsSegmentBar({ segments }: ContactsSegmentBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSegmentSelect = (segment: Segment) => {
    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString())

    // For now, we'll set the segment ID in the URL
    // In a full implementation, you would parse the segment.filters
    // and apply them as individual query parameters
    params.set('segment', segment.id)

    // Navigate to the new URL
    router.push(`/contacts?${params.toString()}`)
  }

  // For now, we don't extract current filters from URL params
  // This would be implemented based on the contacts page filter UI
  const currentFilters: SegmentFilter[] = []

  return (
    <SegmentDropdown
      entityType="CONTACT"
      segments={segments}
      currentFilters={currentFilters}
      onSegmentSelect={handleSegmentSelect}
    />
  )
}
