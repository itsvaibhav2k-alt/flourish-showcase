'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  DollarSign,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrantWithMeta } from '../queries'
import { GRANT_STATUS_METADATA, type GrantStatus } from '../schemas/grant.schema'

interface GrantCardProps {
  grant: GrantWithMeta
  onEdit: (grant: GrantWithMeta) => void
  onDelete: (grant: GrantWithMeta) => void
  onSubmit: (grant: GrantWithMeta) => void
  onApprove: (grant: GrantWithMeta) => void
  onDecline: (grant: GrantWithMeta) => void
  onViewDetails: (grant: GrantWithMeta) => void
  index?: number
}

export function GrantCard({
  grant,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onDecline,
  onViewDetails,
  index = 0,
}: GrantCardProps) {
  const statusMetadata = GRANT_STATUS_METADATA[grant.status]

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'TBD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="group">
      <Card
        className={cn(
          'relative overflow-hidden transition-colors duration-150 cursor-pointer',
          'shadow-card border-neutral-200/60 bg-white hover:border-neutral-300',
          grant.isOverdue && 'border-amber-300',
          grant.isReportingOverdue && 'border-rose-300'
        )}
        onClick={() => onViewDetails(grant)}
      >
        {/* Status indicator bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            statusMetadata.color === 'emerald' && 'bg-emerald-500',
            statusMetadata.color === 'amber' && 'bg-amber-500',
            statusMetadata.color === 'blue' && 'bg-blue-500',
            statusMetadata.color === 'rose' && 'bg-rose-500',
            statusMetadata.color === 'purple' && 'bg-purple-500',
            statusMetadata.color === 'neutral' && 'bg-neutral-400'
          )}
        />

        <CardContent className="p-5 pt-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    statusMetadata.color === 'emerald' &&
                      'border-emerald-200 text-emerald-700 bg-emerald-50',
                    statusMetadata.color === 'amber' &&
                      'border-amber-200 text-amber-700 bg-amber-50',
                    statusMetadata.color === 'blue' && 'border-blue-200 text-blue-700 bg-blue-50',
                    statusMetadata.color === 'rose' && 'border-rose-200 text-rose-700 bg-rose-50',
                    statusMetadata.color === 'purple' &&
                      'border-purple-200 text-purple-700 bg-purple-50',
                    statusMetadata.color === 'neutral' &&
                      'border-neutral-200 text-neutral-600 bg-neutral-50'
                  )}
                >
                  {statusMetadata.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                {grant.funderName}
              </h3>
              {grant.grantName && (
                <p className="text-sm text-neutral-600 truncate">{grant.grantName}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onViewDetails(grant)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(grant)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Grant
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {grant.status === 'draft' && (
                  <DropdownMenuItem onClick={() => onSubmit(grant)}>
                    <Send className="h-4 w-4 mr-2 text-blue-600" />
                    Mark as Submitted
                  </DropdownMenuItem>
                )}
                {(grant.status === 'submitted' || grant.status === 'pending') && (
                  <>
                    <DropdownMenuItem onClick={() => onApprove(grant)}>
                      <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                      Mark as Approved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDecline(grant)}>
                      <XCircle className="h-4 w-4 mr-2 text-rose-600" />
                      Mark as Declined
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(grant)}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Grant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Amount info */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-600">Requested:</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(grant.amountRequested)}
              </span>
            </div>
            {grant.amountAwarded && (
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-neutral-600">Awarded:</span>
                <span className="font-medium text-emerald-700">
                  {formatCurrency(grant.amountAwarded)}
                </span>
              </div>
            )}
          </div>

          {/* Deadline/Dates row */}
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            {grant.deadline && grant.status === 'draft' && (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  grant.isOverdue && 'text-amber-600'
                )}
              >
                {grant.isOverdue ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4 text-neutral-400" />
                )}
                <span>
                  {grant.isOverdue
                    ? `${Math.abs(grant.daysUntilDeadline!)} days overdue`
                    : `Due: ${formatDate(grant.deadline)}`}
                </span>
              </div>
            )}
            {grant.reportingDue && grant.status === 'reporting' && (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  grant.isReportingOverdue && 'text-rose-600'
                )}
              >
                {grant.isReportingOverdue ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4 text-neutral-400" />
                )}
                <span>
                  {grant.isReportingOverdue
                    ? `Report ${Math.abs(grant.daysUntilReporting!)} days overdue`
                    : `Report due: ${formatDate(grant.reportingDue)}`}
                </span>
              </div>
            )}
            {grant.submittedAt && (
              <div className="flex items-center gap-1.5">
                <Send className="h-4 w-4 text-neutral-400" />
                <span>Submitted: {formatDate(grant.submittedAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
