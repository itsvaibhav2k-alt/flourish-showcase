'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  onApply: (startDate: string, endDate: string) => void
  defaultStartDate?: string
  defaultEndDate?: string
}

/**
 * Date range picker component with quick presets
 */
export function DateRangePicker({
  onApply,
  defaultStartDate,
  defaultEndDate,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(defaultStartDate || '')
  const [endDate, setEndDate] = useState(defaultEndDate || '')

  const handlePreset = (preset: string) => {
    const now = new Date()
    let start: Date
    let end = new Date()

    switch (preset) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-3-months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case 'last-12-months':
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
        break
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'last-year':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        return
    }

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    setStartDate(startStr)
    setEndDate(endStr)
    onApply(startStr, endStr)
  }

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate)
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onApply('', '')
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <Calendar className="h-4 w-4" />
        <span>Date Range</span>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset('this-month')}
          className="text-xs"
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset('last-3-months')}
          className="text-xs"
        >
          Last 3 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset('last-12-months')}
          className="text-xs"
        >
          Last 12 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset('this-year')}
          className="text-xs"
        >
          This Year
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset('last-year')}
          className="text-xs"
        >
          Last Year
        </Button>
      </div>

      {/* Custom Date Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Apply/Clear Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleApply}
          disabled={!startDate || !endDate}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
          size="sm"
        >
          Apply
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="sm"
          className="px-4"
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
