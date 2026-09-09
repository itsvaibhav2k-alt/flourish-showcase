'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export interface ContactFilterValues {
  search: string
  type: 'all' | 'donors' | 'volunteers'
  tags: string[]
}

interface ContactFiltersProps {
  filters: ContactFilterValues
  onFiltersChange: (filters: ContactFilterValues) => void
  availableTags?: string[]
}

export function ContactFilters({
  filters,
  onFiltersChange,
  availableTags = [],
}: ContactFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const handleTypeChange = (type: ContactFilterValues['type']) => {
    onFiltersChange({ ...filters, type })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      tags: [],
    })
  }

  const hasActiveFilters =
    filters.search !== '' || filters.type !== 'all' || filters.tags.length > 0

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="donors">Donors Only</SelectItem>
            <SelectItem value="volunteers">Volunteers Only</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-neutral-500">Tags:</span>
          {availableTags.map(tag => {
            const isActive = filters.tags.includes(tag)
            return (
              <Badge
                key={tag}
                variant={isActive ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
