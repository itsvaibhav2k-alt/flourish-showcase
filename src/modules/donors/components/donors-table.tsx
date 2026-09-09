'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Eye, DollarSign, MoreHorizontal, Mail, ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LapseRiskBadge } from './lapse-risk-badge'
import { ScoreInfoButton } from '@/components/common/score-info-button'
import { scoreDefinitions } from '@/lib/content/score-definitions'
import { calculateLapseRisk } from '../services/lapse-risk-calculator'
import type { DonorWithStats, DonorSegment } from '../queries/get-donors'
import { EmptyState } from '@/components/common/empty-state'
import { cn } from '@/lib/utils'

interface DonorsTableProps {
  donors: DonorWithStats[]
}

type SortField = 'name' | 'lifetime_giving' | 'last_gift_date'
type SegmentFilter = DonorSegment | 'all'
type RiskFilter = 'all' | 'low' | 'medium' | 'high'

/**
 * Premium data table component for displaying donors list
 * Inspired by Linear and Stripe dashboard patterns
 */
export function DonorsTable({ donors }: DonorsTableProps) {
  const [sortField, setSortField] = useState<SortField>('lifetime_giving')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch from Radix UI useId()
  useEffect(() => {
    setMounted(true)
  }, [])

  // Format currency with monospace styling
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date with monospace styling
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  // Segment badge with dot indicator
  const getSegmentBadge = (segment: DonorSegment) => {
    const configs: Record<DonorSegment, { dot: string; bg: string; text: string; label: string }> = {
      all: { dot: 'bg-neutral-400', bg: 'bg-neutral-50', text: 'text-neutral-600', label: 'All' },
      new: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'New' },
      active: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Active' },
      lapsed: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Lapsed' },
      major: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Major' },
    }
    const config = configs[segment]

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

  // Filter donors
  const filteredDonors = donors.filter((donor) => {
    if (segmentFilter !== 'all' && donor.segment !== segmentFilter) return false
    if (riskFilter !== 'all') {
      const risk = calculateLapseRisk({
        giftCount: donor.gift_count,
        lastGiftDate: donor.last_gift_date ? new Date(donor.last_gift_date) : null,
        avgGiftGap: donor.avg_gift_gap_days,
      })
      if (risk !== riskFilter) return false
    }
    return true
  })

  // Sort donors
  const sortedDonors = [...filteredDonors].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = `${a.last_name} ${a.first_name}`.localeCompare(
        `${b.last_name} ${b.first_name}`
      )
    } else if (sortField === 'lifetime_giving') {
      comparison = a.lifetime_giving - b.lifetime_giving
    } else if (sortField === 'last_gift_date') {
      if (!a.last_gift_date) return 1
      if (!b.last_gift_date) return -1
      comparison =
        new Date(a.last_gift_date).getTime() - new Date(b.last_gift_date).getTime()
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Check if any filters are active
  const hasActiveFilters = segmentFilter !== 'all' || riskFilter !== 'all'

  if (donors.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white">
        <EmptyState
          icon={DollarSign}
          title="No donors yet"
          description="Record a gift to see donor statistics"
          action={{
            label: "Log Gift",
            href: "/donors/new-gift"
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pill-shaped Filter Toolbar (Stripe-inspired) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
          <FilterPill
            label="Segment"
            value={segmentFilter === 'all' ? 'All Segments' : segmentFilter.charAt(0).toUpperCase() + segmentFilter.slice(1)}
            options={[
              { value: 'all', label: 'All Segments' },
              { value: 'new', label: 'New' },
              { value: 'active', label: 'Active' },
              { value: 'lapsed', label: 'Lapsed' },
              { value: 'major', label: 'Major' },
            ]}
            onChange={(value) => setSegmentFilter(value as SegmentFilter)}
            mounted={mounted}
          />
          <div className="h-5 w-px bg-neutral-200" />
          <FilterPill
            label="Risk"
            value={riskFilter === 'all' ? 'All Risk Levels' : riskFilter.charAt(0).toUpperCase() + riskFilter.slice(1)}
            options={[
              { value: 'all', label: 'All Risk Levels' },
              { value: 'low', label: 'Low Risk' },
              { value: 'medium', label: 'Medium Risk' },
              { value: 'high', label: 'High Risk' },
            ]}
            onChange={(value) => setRiskFilter(value as RiskFilter)}
            mounted={mounted}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSegmentFilter('all')
              setRiskFilter('all')
            }}
            className="h-8 text-xs text-neutral-500 hover:text-neutral-700"
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-neutral-500">
          {sortedDonors.length} {sortedDonors.length === 1 ? 'donor' : 'donors'}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1.5 px-0 h-auto font-semibold uppercase tracking-wider text-xs text-neutral-500 hover:bg-transparent hover:text-neutral-700"
                >
                  Name
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort('lifetime_giving')}
                    className="flex items-center gap-1.5 px-0 h-auto font-semibold uppercase tracking-wider text-xs text-neutral-500 hover:bg-transparent hover:text-neutral-700"
                  >
                    Lifetime Giving
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                  <ScoreInfoButton
                    scoreKey="lifetimeGiving"
                    size="sm"
                    scoreDefinitions={scoreDefinitions}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('last_gift_date')}
                  className="flex items-center gap-1.5 px-0 h-auto font-semibold uppercase tracking-wider text-xs text-neutral-500 hover:bg-transparent hover:text-neutral-700"
                >
                  Last Gift
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Segment
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <div className="flex items-center gap-1">
                  Lapse Risk
                  <ScoreInfoButton
                    scoreKey="lapseRisk"
                    size="sm"
                    scoreDefinitions={scoreDefinitions}
                  />
                </div>
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 w-[100px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDonors.map((donor) => {
              const lapseRisk = calculateLapseRisk({
                giftCount: donor.gift_count,
                lastGiftDate: donor.last_gift_date ? new Date(donor.last_gift_date) : null,
                avgGiftGap: donor.avg_gift_gap_days,
              })

              return (
                <TableRow
                  key={donor.id}
                  className="group hover:bg-neutral-50 transition-colors"
                >
                  <TableCell>
                    <Link href={`/donors/${donor.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600">
                          {donor.first_name?.[0]}{donor.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                            {donor.first_name} {donor.last_name}
                          </p>
                          {donor.email && (
                            <p className="text-sm text-neutral-500 font-mono text-xs">{donor.email}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums font-semibold text-neutral-900">
                      {formatCurrency(donor.lifetime_giving)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums text-sm text-neutral-600">
                      {formatDate(donor.last_gift_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {donor.segment !== 'all' && getSegmentBadge(donor.segment)}
                  </TableCell>
                  <TableCell>
                    <LapseRiskBadge risk={lapseRisk} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/donors/${donor.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4 text-neutral-500" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      {mounted ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link href={`/donors/${donor.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/donors/${donor.id}/gift`} className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Log Gift
                              </Link>
                            </DropdownMenuItem>
                            {donor.email && (
                              <DropdownMenuItem asChild>
                                <Link href={`/communications/compose?to=${donor.id}`} className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Send Email
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedDonors.map((donor) => {
          const lapseRisk = calculateLapseRisk({
            giftCount: donor.gift_count,
            lastGiftDate: donor.last_gift_date ? new Date(donor.last_gift_date) : null,
            avgGiftGap: donor.avg_gift_gap_days,
          })

          return (
            <Link key={donor.id} href={`/donors/${donor.id}`} className="block">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3 active:bg-neutral-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600 shrink-0">
                      {donor.first_name?.[0]}{donor.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {donor.first_name} {donor.last_name}
                      </p>
                      {donor.email && (
                        <p className="text-xs text-neutral-500 font-mono truncate max-w-[180px]">
                          {donor.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-neutral-900">
                    {formatCurrency(donor.lifetime_giving)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    {donor.segment !== 'all' && getSegmentBadge(donor.segment)}
                    <LapseRiskBadge risk={lapseRisk} />
                  </div>
                  <span className="font-mono tabular-nums text-xs text-neutral-500">
                    {formatDate(donor.last_gift_date)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Filter Pill Component (Stripe-style)
function FilterPill({
  label,
  value,
  options,
  onChange,
  mounted,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  mounted: boolean
}) {
  // Static placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-700 rounded-full">
        <span className="text-neutral-500">{label}:</span>
        <span className="font-medium">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </div>
    )
  }

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
