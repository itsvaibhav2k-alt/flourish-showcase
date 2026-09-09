'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PipelineFilters() {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    stage: 'all',
    assignedStaff: 'all',
    readinessMin: '',
    readinessMax: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  })

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'stage' && value !== '' && value !== 'all'
  )

  const clearFilters = () => {
    setFilters({
      stage: 'all',
      assignedStaff: 'all',
      readinessMin: '',
      readinessMax: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
    })
  }

  return (
    <div className="space-y-3">
      {/* Filter Toggle & Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search prospects by name or email..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="pl-10 bg-white border-neutral-200/60 shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          className={cn(
            'shadow-sm',
            isOpen && 'bg-primary-50 border-primary-200 text-primary-700'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary-600" />
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="shadow-card border-neutral-200/60 bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-700">
                  Stage
                </Label>
                <Select
                  value={filters.stage}
                  onValueChange={(value) => setFilters({ ...filters, stage: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="qualification">Qualification</SelectItem>
                    <SelectItem value="cultivation">Cultivation</SelectItem>
                    <SelectItem value="solicitation">Solicitation</SelectItem>
                    <SelectItem value="stewardship">Stewardship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Staff Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-700">
                  Assigned Staff
                </Label>
                <Select
                  value={filters.assignedStaff}
                  onValueChange={(value) =>
                    setFilters({ ...filters, assignedStaff: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {/* TODO: Dynamically load team members */}
                  </SelectContent>
                </Select>
              </div>

              {/* Readiness Score Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-700">
                  Readiness Score
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="100"
                    value={filters.readinessMin}
                    onChange={(e) =>
                      setFilters({ ...filters, readinessMin: e.target.value })
                    }
                    className="w-full"
                  />
                  <span className="text-neutral-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="100"
                    value={filters.readinessMax}
                    onChange={(e) =>
                      setFilters({ ...filters, readinessMax: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-700">
                  Next Move Date
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full"
                  />
                  <span className="text-neutral-400">-</span>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs font-medium text-neutral-700 mb-2">
                Quick Filters
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, readinessMin: '80', readinessMax: '100' })
                  }
                >
                  High Readiness (80+)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, stage: 'cultivation' })
                  }
                >
                  In Cultivation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      dateFrom: new Date().toISOString().split('T')[0],
                      dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0],
                    })
                  }
                >
                  Next 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, assignedStaff: 'unassigned' })
                  }
                >
                  Unassigned
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
