'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Donation } from '../schemas/donation.schema'
import type { DonationFilters, GetDonationsResult } from '../queries/get-donations'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  ChevronDown,
  Mail,
  MoreHorizontal,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DonationsTableProps {
  initialData?: GetDonationsResult
  onFetch: (params: {
    page: number
    limit: number
    filters: DonationFilters
  }) => Promise<GetDonationsResult>
  className?: string
}

type StatusFilter = Donation['status'] | 'all'
type FrequencyFilter = Donation['frequency'] | 'all'

/**
 * Premium data table component for displaying and filtering donations
 * Inspired by Linear and Stripe dashboard patterns
 */
export function DonationsTable({ initialData, onFetch, className }: DonationsTableProps) {
  const [data, setData] = useState<GetDonationsResult | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [filters, setFilters] = useState<DonationFilters>({})
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDonations = async () => {
    setIsLoading(true)
    try {
      const result = await onFetch({
        page,
        limit,
        filters: {
          ...filters,
          search: searchQuery || undefined,
        },
      })
      setData(result)
    } catch (error) {
      console.error('Error fetching donations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDonations()
  }, [page, filters])

  const handleSearch = () => {
    setPage(1)
    fetchDonations()
  }

  const handleFilterChange = (key: keyof DonationFilters, value: string | undefined) => {
    setPage(1)
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setPage(1)
  }

  const hasActiveFilters = filters.status || filters.frequency || searchQuery

  const exportToCSV = () => {
    if (!data?.donations.length) return

    const headers = [
      'Date',
      'Donor Name',
      'Email',
      'Amount',
      'Frequency',
      'Status',
      'Payment Provider',
    ]
    const rows = data.donations.map((d) => [
      format(new Date(d.created_at), 'yyyy-MM-dd HH:mm:ss'),
      `${d.donor_first_name || ''} ${d.donor_last_name || ''}`.trim(),
      d.donor_email || '',
      d.amount.toString(),
      d.frequency,
      d.status,
      d.payment_provider || '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donations-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Status badge with dot indicator (Linear-style)
  const getStatusBadge = (status: Donation['status']) => {
    const configs = {
      completed: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
      pending: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      processing: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Processing' },
      failed: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', label: 'Failed' },
      refunded: { dot: 'bg-neutral-400', bg: 'bg-neutral-50', text: 'text-neutral-600', label: 'Refunded' },
    }
    const config = configs[status]

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg, config.text
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
        {config.label}
      </span>
    )
  }

  // Frequency badge with dot indicator
  const getFrequencyBadge = (frequency: Donation['frequency']) => {
    const configs = {
      'one-time': { dot: 'bg-neutral-400', bg: 'bg-neutral-50', text: 'text-neutral-600', label: 'One-time' },
      monthly: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Monthly' },
      quarterly: { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Quarterly' },
      annually: { dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', label: 'Annually' },
    }
    const config = configs[frequency]

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg, config.text
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
        {config.label}
      </span>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Donations
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {data?.total || 0} total donations
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2 h-9">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Pill-shaped Filter Toolbar (Stripe-inspired) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-9"
          />
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
          <FilterPill
            label="Status"
            value={filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1) : 'All Status'}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            onChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          />
          <div className="h-5 w-px bg-neutral-200" />
          <FilterPill
            label="Type"
            value={filters.frequency ? (filters.frequency === 'one-time' ? 'One-time' : filters.frequency.charAt(0).toUpperCase() + filters.frequency.slice(1)) : 'All Types'}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'one-time', label: 'One-time' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annually', label: 'Annually' },
            ]}
            onChange={(value) => handleFilterChange('frequency', value === 'all' ? undefined : value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-neutral-500 hover:text-neutral-700"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : !data?.donations.length ? (
          <div className="text-center py-16">
            <DollarSign className="h-12 w-12 mx-auto text-neutral-200 mb-3" />
            <p className="text-sm font-medium text-neutral-900">No donations found</p>
            <p className="text-sm text-neutral-500 mt-1">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Donations will appear here once recorded'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="link" size="sm" className="mt-3">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Donor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Frequency
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.donations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="group hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono tabular-nums text-sm text-neutral-600">
                          {format(new Date(donation.created_at), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-sm font-medium text-neutral-600 shrink-0">
                            {donation.donor_first_name?.[0]}{donation.donor_last_name?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {donation.donor_first_name} {donation.donor_last_name}
                            </div>
                            {donation.donor_email && (
                              <div className="text-xs text-neutral-500 font-mono truncate max-w-[200px]">
                                {donation.donor_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono tabular-nums font-semibold text-neutral-900">
                          ${donation.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {getFrequencyBadge(donation.frequency)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(donation.status)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {donation.donor_email && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Email Receipt
                                </DropdownMenuItem>
                              )}
                              {donation.status === 'failed' && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4" />
                                  Retry Payment
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-neutral-100">
              {data.donations.map((donation) => (
                <div key={donation.id} className="p-4 space-y-3 active:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-sm font-medium text-neutral-600 shrink-0">
                        {donation.donor_first_name?.[0]}{donation.donor_last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          {donation.donor_first_name} {donation.donor_last_name}
                        </div>
                        <div className="font-mono tabular-nums text-xs text-neutral-500">
                          {format(new Date(donation.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-neutral-900">
                      ${donation.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      {getFrequencyBadge(donation.frequency)}
                      {getStatusBadge(donation.status)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {donation.donor_email && (
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Receipt
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {donation.donor_email && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {donation.donor_email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-neutral-500">
            Showing <span className="font-mono tabular-nums font-medium text-neutral-700">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-mono tabular-nums font-medium text-neutral-700">{Math.min(page * limit, data.total)}</span> of{' '}
            <span className="font-mono tabular-nums font-medium text-neutral-700">{data.total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2 text-sm">
              <span className="font-mono tabular-nums font-medium">{page}</span>
              <span className="text-neutral-400">/</span>
              <span className="font-mono tabular-nums text-neutral-500">{data.totalPages}</span>
            </div>
            <Button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages || isLoading}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Filter Pill Component (Stripe-style)
function FilterPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-full transition-colors">
          <span className="text-neutral-500">{label}:</span>
          <span className="font-medium">{value}</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'cursor-pointer',
              value === option.label && 'bg-neutral-100'
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
