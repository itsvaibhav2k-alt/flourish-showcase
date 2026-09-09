'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type DateFilterType = 'upcoming' | 'this-week' | 'this-month' | 'past'

interface ShiftsFilterContextType {
  dateFilter: DateFilterType
  setDateFilter: (filter: DateFilterType) => void
}

const ShiftsFilterContext = createContext<ShiftsFilterContextType | undefined>(undefined)

export function ShiftsFilterProvider({ children }: { children: ReactNode }) {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('upcoming')

  return (
    <ShiftsFilterContext.Provider value={{ dateFilter, setDateFilter }}>
      {children}
    </ShiftsFilterContext.Provider>
  )
}

export function useShiftsFilter() {
  const context = useContext(ShiftsFilterContext)
  if (context === undefined) {
    throw new Error('useShiftsFilter must be used within a ShiftsFilterProvider')
  }
  return context
}

export function ShiftsFilterBar() {
  const { dateFilter, setDateFilter } = useShiftsFilter()

  const filters: { value: DateFilterType; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'past', label: 'Past' },
  ]

  return (
    <div className="p-4 border-b border-neutral-100 flex items-center gap-2">
      <span className="text-sm font-medium text-neutral-600 mr-2">Filter:</span>
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={dateFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(filter.value)}
            className={
              dateFilter === filter.value
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'border-neutral-200 hover:bg-teal-50 hover:border-teal-200'
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
