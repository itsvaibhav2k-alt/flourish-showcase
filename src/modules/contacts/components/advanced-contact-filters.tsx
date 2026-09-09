'use client'

import * as React from 'react'
import {
  Search,
  X,
  Filter,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronDown,
  Save,
  Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'

export interface AdvancedFilterValues {
  search: string
  type: 'all' | 'donors' | 'volunteers' | 'both'
  tags: string[]
  excludeTags: string[]
  giftDateFrom: string
  giftDateTo: string
  giftAmountMin: number | null
  giftAmountMax: number | null
  lapseRisk: 'all' | 'low' | 'medium' | 'high'
  lastActivityDays: number | null
  hasEmail: 'all' | 'yes' | 'no'
  lifetimeGivingMin: number | null
  lifetimeGivingMax: number | null
}

interface AdvancedContactFiltersProps {
  filters: AdvancedFilterValues
  onFiltersChange: (filters: AdvancedFilterValues) => void
  availableTags?: string[]
  onSaveSegment?: (name: string, filters: AdvancedFilterValues) => void
}

export const defaultFilters: AdvancedFilterValues = {
  search: '',
  type: 'all',
  tags: [],
  excludeTags: [],
  giftDateFrom: '',
  giftDateTo: '',
  giftAmountMin: null,
  giftAmountMax: null,
  lapseRisk: 'all',
  lastActivityDays: null,
  hasEmail: 'all',
  lifetimeGivingMin: null,
  lifetimeGivingMax: null,
}

export function AdvancedContactFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  onSaveSegment,
}: AdvancedContactFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [segmentName, setSegmentName] = React.useState('')

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const handleTypeChange = (type: AdvancedFilterValues['type']) => {
    onFiltersChange({ ...filters, type })
  }

  const handleTagToggle = (tag: string, exclude = false) => {
    if (exclude) {
      const newExcludeTags = filters.excludeTags.includes(tag)
        ? filters.excludeTags.filter(t => t !== tag)
        : [...filters.excludeTags, tag]
      onFiltersChange({ ...filters, excludeTags: newExcludeTags })
    } else {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
      onFiltersChange({ ...filters, tags: newTags })
    }
  }

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters)
  }

  const handleSaveSegment = () => {
    if (segmentName.trim() && onSaveSegment) {
      onSaveSegment(segmentName.trim(), filters)
      setSegmentName('')
    }
  }

  const activeFilterCount = [
    filters.search !== '',
    filters.type !== 'all',
    filters.tags.length > 0,
    filters.excludeTags.length > 0,
    filters.giftDateFrom !== '',
    filters.giftDateTo !== '',
    filters.giftAmountMin !== null,
    filters.giftAmountMax !== null,
    filters.lapseRisk !== 'all',
    filters.lastActivityDays !== null,
    filters.hasEmail !== 'all',
    filters.lifetimeGivingMin !== null,
    filters.lifetimeGivingMax !== null,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={filters.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Contact type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="donors">Donors Only</SelectItem>
            <SelectItem value="volunteers">Volunteers Only</SelectItem>
            <SelectItem value="both">Donors & Volunteers</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary-600">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>
                Narrow down your contact list with detailed criteria
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Gift Date Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  Last Gift Date Range
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-neutral-500">From</Label>
                    <Input
                      type="date"
                      value={filters.giftDateFrom}
                      onChange={e => onFiltersChange({ ...filters, giftDateFrom: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">To</Label>
                    <Input
                      type="date"
                      value={filters.giftDateTo}
                      onChange={e => onFiltersChange({ ...filters, giftDateTo: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Gift Amount Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  Gift Amount Range
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-neutral-500">Min Amount</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={filters.giftAmountMin ?? ''}
                      onChange={e => onFiltersChange({
                        ...filters,
                        giftAmountMin: e.target.value ? Number(e.target.value) : null
                      })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Max Amount</Label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.giftAmountMax ?? ''}
                      onChange={e => onFiltersChange({
                        ...filters,
                        giftAmountMax: e.target.value ? Number(e.target.value) : null
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Lifetime Giving Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  Lifetime Giving Range
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-neutral-500">Min Lifetime</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={filters.lifetimeGivingMin ?? ''}
                      onChange={e => onFiltersChange({
                        ...filters,
                        lifetimeGivingMin: e.target.value ? Number(e.target.value) : null
                      })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Max Lifetime</Label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.lifetimeGivingMax ?? ''}
                      onChange={e => onFiltersChange({
                        ...filters,
                        lifetimeGivingMax: e.target.value ? Number(e.target.value) : null
                      })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Lapse Risk */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-neutral-400" />
                  Lapse Risk Tier
                </Label>
                <Select
                  value={filters.lapseRisk}
                  onValueChange={(v) => onFiltersChange({ ...filters, lapseRisk: v as AdvancedFilterValues['lapseRisk'] })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        High Risk
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Medium Risk
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Low Risk
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Activity Days */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  Last Activity Within
                </Label>
                <Select
                  value={filters.lastActivityDays?.toString() ?? 'all'}
                  onValueChange={(v) => onFiltersChange({
                    ...filters,
                    lastActivityDays: v === 'all' ? null : Number(v)
                  })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Has Email */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Has Email Address</Label>
                <Select
                  value={filters.hasEmail}
                  onValueChange={(v) => onFiltersChange({ ...filters, hasEmail: v as AdvancedFilterValues['hasEmail'] })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All contacts</SelectItem>
                    <SelectItem value="yes">With email only</SelectItem>
                    <SelectItem value="no">Without email only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Include Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isActive = filters.tags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {isActive && <Check className="h-3 w-3 mr-1" />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Exclude Tags */}
              {availableTags.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Exclude Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isActive = filters.excludeTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag, true)}
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {isActive && <X className="h-3 w-3 mr-1" />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="flex w-full gap-3">
                <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                  Clear All
                </Button>
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </div>
              {onSaveSegment && activeFilterCount > 0 && (
                <div className="flex w-full gap-2 mt-3">
                  <Input
                    placeholder="Segment name..."
                    value={segmentName}
                    onChange={e => setSegmentName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSaveSegment}
                    disabled={!segmentName.trim()}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    Save
                  </Button>
                </div>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Clear Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="h-10 gap-2"
          >
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type}
              <button
                onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                className="ml-1 hover:text-neutral-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 bg-primary-100 text-primary-700">
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:text-primary-900"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.lapseRisk !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Risk: {filters.lapseRisk}
              <button
                onClick={() => onFiltersChange({ ...filters, lapseRisk: 'all' })}
                className="ml-1 hover:text-neutral-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.giftAmountMin !== null || filters.giftAmountMax !== null) && (
            <Badge variant="secondary" className="gap-1">
              Gift: ${filters.giftAmountMin ?? 0} - ${filters.giftAmountMax ?? '∞'}
              <button
                onClick={() => onFiltersChange({ ...filters, giftAmountMin: null, giftAmountMax: null })}
                className="ml-1 hover:text-neutral-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
