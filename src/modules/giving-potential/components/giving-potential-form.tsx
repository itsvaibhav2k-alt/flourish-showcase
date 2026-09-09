'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, DollarSign, Briefcase, Home, LineChart, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface GivingPotentialFormData {
  employer?: string | null
  job_title?: string | null
  estimated_net_worth?: number | null
  real_estate_value?: number | null
  stock_holdings?: number | null
  political_donations?: number | null
  nonprofit_board_count?: number | null
  notes?: string | null
}

interface GivingPotentialFormProps {
  contactId: string
  initialData?: GivingPotentialFormData
  onSuccess?: () => void
  className?: string
}

/**
 * Form to manually enter/edit giving potential data
 * Uses react state for form handling
 * Calls the save-giving-potential server action
 */
export function GivingPotentialForm({
  contactId,
  initialData,
  onSuccess,
  className
}: GivingPotentialFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [employer, setEmployer] = useState(initialData?.employer || '')
  const [jobTitle, setJobTitle] = useState(initialData?.job_title || '')
  const [estimatedNetWorth, setEstimatedNetWorth] = useState(
    initialData?.estimated_net_worth?.toString() || ''
  )
  const [realEstateValue, setRealEstateValue] = useState(
    initialData?.real_estate_value?.toString() || ''
  )
  const [stockHoldings, setStockHoldings] = useState(
    initialData?.stock_holdings?.toString() || ''
  )
  const [politicalDonations, setPoliticalDonations] = useState(
    initialData?.political_donations?.toString() || ''
  )
  const [nonprofitBoardCount, setNonprofitBoardCount] = useState(
    initialData?.nonprofit_board_count?.toString() || ''
  )
  const [notes, setNotes] = useState(initialData?.notes || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Import the action dynamically to avoid build-time errors if it doesn't exist yet
      const { saveGivingPotential } = await import('../actions/save-giving-potential')

      const data: GivingPotentialFormData = {
        employer: employer || null,
        job_title: jobTitle || null,
        estimated_net_worth: estimatedNetWorth ? parseFloat(estimatedNetWorth) : null,
        real_estate_value: realEstateValue ? parseFloat(realEstateValue) : null,
        stock_holdings: stockHoldings ? parseFloat(stockHoldings) : null,
        political_donations: politicalDonations ? parseFloat(politicalDonations) : null,
        nonprofit_board_count: nonprofitBoardCount ? parseInt(nonprofitBoardCount, 10) : null,
        notes: notes || null,
      }

      const result = await saveGivingPotential(contactId, data)

      if (result.success) {
        setSuccess(true)
        router.refresh()
        if (onSuccess) {
          setTimeout(onSuccess, 500)
        }
      } else {
        setError(result.error || 'Failed to save giving potential data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">Error</p>
          <p className="text-sm text-rose-700 mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Success</p>
          <p className="text-sm text-green-700 mt-1">
            Giving potential data saved successfully
          </p>
        </div>
      )}

      {/* Employment Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <Briefcase className="h-4 w-4" />
          Employment Information
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employer" className="text-sm font-medium text-neutral-700">
              Employer
            </Label>
            <Input
              id="employer"
              value={employer}
              onChange={e => setEmployer(e.target.value)}
              placeholder="Company name"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-sm font-medium text-neutral-700">
              Job Title
            </Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g., CEO, Director"
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Wealth Indicators */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <DollarSign className="h-4 w-4" />
          Wealth Indicators
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="estimatedNetWorth" className="text-sm font-medium text-neutral-700">
              Estimated Net Worth
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <Input
                id="estimatedNetWorth"
                type="number"
                value={estimatedNetWorth}
                onChange={e => setEstimatedNetWorth(e.target.value)}
                placeholder="0"
                className="h-11 pl-7"
                min="0"
                step="1000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="realEstateValue" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-neutral-400" />
              Real Estate Value
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <Input
                id="realEstateValue"
                type="number"
                value={realEstateValue}
                onChange={e => setRealEstateValue(e.target.value)}
                placeholder="0"
                className="h-11 pl-7"
                min="0"
                step="1000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockHoldings" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 text-neutral-400" />
              Stock Holdings
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <Input
                id="stockHoldings"
                type="number"
                value={stockHoldings}
                onChange={e => setStockHoldings(e.target.value)}
                placeholder="0"
                className="h-11 pl-7"
                min="0"
                step="1000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="politicalDonations" className="text-sm font-medium text-neutral-700">
              Political Donations
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <Input
                id="politicalDonations"
                type="number"
                value={politicalDonations}
                onChange={e => setPoliticalDonations(e.target.value)}
                placeholder="0"
                className="h-11 pl-7"
                min="0"
                step="100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Philanthropy */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          Philanthropy Activity
        </div>
        <div className="space-y-2">
          <Label htmlFor="nonprofitBoardCount" className="text-sm font-medium text-neutral-700">
            Nonprofit Board Memberships
          </Label>
          <Input
            id="nonprofitBoardCount"
            type="number"
            value={nonprofitBoardCount}
            onChange={e => setNonprofitBoardCount(e.target.value)}
            placeholder="0"
            className="h-11"
            min="0"
            max="50"
          />
          <p className="text-xs text-neutral-500">
            Number of nonprofit boards this contact serves on
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-neutral-400" />
          Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional information about wealth indicators, giving capacity, or research notes"
          className="min-h-[100px]"
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="min-w-[160px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
