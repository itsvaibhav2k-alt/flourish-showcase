'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/modules/reports/components/date-range-picker'
import { ExportButton } from '@/modules/reports/components/export-button'
import { GivingReport } from '@/modules/reports/components/giving-report'
import { VolunteerReport } from '@/modules/reports/components/volunteer-report'
import { DonorMetrics } from '@/modules/reports/components/donor-metrics'

// Helper function to get default date range (Last 12 months)
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 12)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

// Helper function to get initial date range - always return not loaded for SSR consistency
function getInitialDateRange() {
  return { startDate: '', endDate: '', isLoaded: false }
}

// Load date range from localStorage on client
function loadDateRangeFromStorage() {
  const savedStartDate = localStorage.getItem('reports-start-date')
  const savedEndDate = localStorage.getItem('reports-end-date')

  if (savedStartDate && savedEndDate) {
    return { startDate: savedStartDate, endDate: savedEndDate, isLoaded: true }
  }

  const defaultRange = getDefaultDateRange()
  return { startDate: defaultRange.startDate, endDate: defaultRange.endDate, isLoaded: true }
}

/**
 * Reports dashboard page
 * Shows giving trends, donor metrics, and volunteer hours
 * Includes date range filtering and CSV export functionality
 */
export default function ReportsPage() {
  // Use lazy initialization to avoid cascading setState in useEffect
  const [dateRange, setDateRange] = useState(() => getInitialDateRange())

  const { startDate, endDate, isLoaded } = dateRange

  // Client-side initialization after hydration - necessary for SSR compatibility
  useEffect(() => {
    if (!isLoaded) {
      setDateRange(loadDateRangeFromStorage())
    }
  }, [isLoaded])

  // Save date range to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && startDate && endDate) {
      localStorage.setItem('reports-start-date', startDate)
      localStorage.setItem('reports-end-date', endDate)
    }
  }, [startDate, endDate, isLoaded])

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setDateRange(prev => ({ ...prev, startDate: newStartDate, endDate: newEndDate }))
  }

  // Don't render until we've loaded the saved preferences
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Reports & Exports</h1>
            <p className="text-neutral-500 text-sm mt-1">
              View analytics and export your data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton exportType="contacts" label="Export Contacts" />
            <ExportButton
              exportType="gifts"
              label="Export Gifts"
              filters={{ startDate, endDate }}
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div>
            <DateRangePicker
              onApply={handleDateRangeChange}
              defaultStartDate={startDate}
              defaultEndDate={endDate}
            />

            {/* Quick Export Card */}
            <Card className="shadow-card border-neutral-200/60 bg-white mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-neutral-900">
                  Quick Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ExportButton
                  exportType="donors"
                  label="Export Donors"
                  variant="outline"
                  size="sm"
                />
                <ExportButton
                  exportType="volunteers"
                  label="Export Volunteers"
                  variant="outline"
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Donor Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-violet-600" />
                </div>
                Donor Overview
              </h2>
              <DonorMetrics />
            </div>

            {/* Giving Report */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Giving Trends</h2>
                {(startDate || endDate) && (
                  <span className="text-xs text-neutral-500">
                    {startDate && `From ${new Date(startDate).toLocaleDateString()}`}
                    {startDate && endDate && ' - '}
                    {endDate && `to ${new Date(endDate).toLocaleDateString()}`}
                  </span>
                )}
              </div>
              <GivingReport startDate={startDate} endDate={endDate} />
            </div>

            {/* Volunteer Report */}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Volunteer Activity
              </h2>
              <VolunteerReport startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
