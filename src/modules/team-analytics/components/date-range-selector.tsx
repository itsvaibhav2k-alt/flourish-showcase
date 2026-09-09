'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type { DateRangeType } from '../queries'

interface DateRangeSelectorProps {
  selected: DateRangeType
  onChange: (range: DateRangeType) => void
}

export function DateRangeSelector({ selected, onChange }: DateRangeSelectorProps) {
  const ranges: { value: DateRangeType; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ]

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-neutral-500" />
      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
        {ranges.map((range) => (
          <Button
            key={range.value}
            onClick={() => onChange(range.value)}
            variant={selected === range.value ? 'default' : 'ghost'}
            size="sm"
            className={
              selected === range.value
                ? 'bg-white shadow-sm text-neutral-900 hover:bg-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
