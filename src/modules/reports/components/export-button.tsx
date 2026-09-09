'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import {
  exportContacts,
  exportDonors,
  exportGifts,
  exportVolunteers,
} from '../actions/export-csv'

interface ExportButtonProps {
  exportType: 'contacts' | 'donors' | 'gifts' | 'volunteers'
  label?: string
  filters?: {
    startDate?: string
    endDate?: string
  }
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

/**
 * Reusable export button component
 * Handles CSV export with loading state and triggers download
 */
export function ExportButton({
  exportType,
  label,
  filters,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      let csv: string
      switch (exportType) {
        case 'contacts':
          csv = await exportContacts()
          break
        case 'donors':
          csv = await exportDonors()
          break
        case 'gifts':
          csv = await exportGifts(filters)
          break
        case 'volunteers':
          csv = await exportVolunteers()
          break
        default:
          throw new Error('Invalid export type')
      }

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${exportType}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className="border-neutral-200 hover:bg-neutral-50"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {label || 'Export CSV'}
        </>
      )}
    </Button>
  )
}
