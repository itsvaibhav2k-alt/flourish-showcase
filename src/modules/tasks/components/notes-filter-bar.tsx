'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { NoteType } from '../schemas/task.schema'

interface NotesFilterBarProps {
  selectedType: NoteType | 'all'
  onTypeChange: (type: NoteType | 'all') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  className?: string
}

const NOTE_TYPES: { value: NoteType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'phone_call', label: 'Calls' },
  { value: 'email', label: 'Emails' },
  { value: 'personal_info', label: 'Personal' },
  { value: 'follow_up', label: 'Follow-ups' },
  { value: 'donation', label: 'Donation' },
  { value: 'volunteer', label: 'Volunteer' },
]

export function NotesFilterBar({
  selectedType,
  onTypeChange,
  searchQuery,
  onSearchChange,
  className,
}: NotesFilterBarProps) {
  const [showSearch, setShowSearch] = React.useState(false)

  return (
    <div className={cn('space-y-3', className)}>
      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {NOTE_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              selectedType === type.value
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {type.label}
          </button>
        ))}

        {/* Search Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors',
            showSearch || searchQuery
              ? 'bg-primary-100 text-primary-700'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Active filter indicator */}
      {(selectedType !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Active filters:</span>
          {selectedType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700">
              {NOTE_TYPES.find(t => t.value === selectedType)?.label}
              <button
                onClick={() => onTypeChange('all')}
                className="ml-0.5 hover:text-primary-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700">
              "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-0.5 hover:text-primary-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              onTypeChange('all')
              onSearchChange('')
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
