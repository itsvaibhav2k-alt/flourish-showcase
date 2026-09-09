'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Eye, TrendingUp, DollarSign } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { GivingPotentialBadge } from './giving-potential-badge'
import { cn } from '@/lib/utils'

interface Prospect {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  overall_score: number
  capacity_score: number
  estimated_capacity: number
  current_giving: number
  giving_gap: number
}

interface ProspectListProps {
  prospects: Prospect[]
  className?: string
}

type SortField = 'name' | 'overall_score' | 'capacity_score' | 'estimated_capacity' | 'giving_gap'
type SortOrder = 'asc' | 'desc'

/**
 * Table/list of top prospects
 * - Columns: Name, Overall Score, Capacity, Current Giving, Gap, Actions
 * - Sortable by score
 * - Click to view contact
 */
export function ProspectList({ prospects, className }: ProspectListProps) {
  const [sortField, setSortField] = useState<SortField>('overall_score')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const sortedProspects = [...prospects].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = `${a.last_name} ${a.first_name}`.localeCompare(
          `${b.last_name} ${b.first_name}`
        )
        break
      case 'overall_score':
        comparison = a.overall_score - b.overall_score
        break
      case 'capacity_score':
        comparison = a.capacity_score - b.capacity_score
        break
      case 'estimated_capacity':
        comparison = a.estimated_capacity - b.estimated_capacity
        break
      case 'giving_gap':
        comparison = a.giving_gap - b.giving_gap
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
    >
      {children}
      <ArrowUpDown
        className={cn(
          'h-4 w-4',
          sortField === field ? 'text-primary-600' : 'text-neutral-400'
        )}
      />
    </button>
  )

  if (prospects.length === 0) {
    return (
      <div className={cn('rounded-lg border border-neutral-200 bg-white p-12', className)}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-3">
            <TrendingUp className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">
            No prospects yet
          </h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            Add giving potential data to contacts to see top prospects
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-neutral-200 bg-white overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="name">Name</SortButton>
            </TableHead>
            <TableHead className="text-center">
              <SortButton field="overall_score">Overall Score</SortButton>
            </TableHead>
            <TableHead className="text-center">
              <SortButton field="capacity_score">Capacity</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="estimated_capacity">Estimated Capacity</SortButton>
            </TableHead>
            <TableHead className="text-right">Current Giving</TableHead>
            <TableHead className="text-right">
              <SortButton field="giving_gap">Gap</SortButton>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProspects.map((prospect) => (
            <TableRow key={prospect.id} className="group">
              <TableCell>
                <div>
                  <Link
                    href={`/contacts/${prospect.id}`}
                    className="font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                  >
                    {prospect.first_name} {prospect.last_name}
                  </Link>
                  {prospect.email && (
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {prospect.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <GivingPotentialBadge score={prospect.overall_score} showIcon={false} />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-neutral-50">
                  <span className="text-sm font-semibold text-neutral-700">
                    {Math.round(prospect.capacity_score)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm font-medium text-neutral-900">
                  {formatCurrency(prospect.estimated_capacity)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-neutral-600">
                  {formatCurrency(prospect.current_giving)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      prospect.giving_gap > 10000
                        ? 'text-green-700'
                        : prospect.giving_gap > 5000
                        ? 'text-amber-700'
                        : 'text-neutral-600'
                    )}
                  >
                    {formatCurrency(prospect.giving_gap)}
                  </span>
                  {prospect.giving_gap > 10000 && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Link href={`/contacts/${prospect.id}`}>
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Summary Footer */}
      <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            Showing <span className="font-medium text-neutral-900">{prospects.length}</span> prospect{prospects.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">
                Total Gap:{' '}
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(
                    prospects.reduce((sum, p) => sum + p.giving_gap, 0)
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
