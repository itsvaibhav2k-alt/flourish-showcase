'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Target,
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignWithStats } from '../queries'
import {
  CAMPAIGN_TYPE_METADATA,
  CAMPAIGN_STATUS_METADATA,
  type CampaignStatus,
} from '../schemas/campaign.schema'

interface CampaignCardProps {
  campaign: CampaignWithStats
  onEdit: (campaign: CampaignWithStats) => void
  onDelete: (campaign: CampaignWithStats) => void
  onStatusChange: (campaign: CampaignWithStats, status: CampaignStatus) => void
  onViewDetails: (campaign: CampaignWithStats) => void
  index?: number
}

export function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  index = 0,
}: CampaignCardProps) {
  const typeMetadata = CAMPAIGN_TYPE_METADATA[campaign.campaignType]
  const statusMetadata = CAMPAIGN_STATUS_METADATA[campaign.status]

  const formatCurrency = (amount: number) => {
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
          campaign.isOverdue && campaign.status === 'active' && 'border-amber-300'
        )}
        onClick={() => onViewDetails(campaign)}
      >
        {/* Status indicator bar */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            statusMetadata.color === 'emerald' && 'bg-emerald-500',
            statusMetadata.color === 'amber' && 'bg-amber-500',
            statusMetadata.color === 'blue' && 'bg-blue-500',
            statusMetadata.color === 'rose' && 'bg-rose-500',
            statusMetadata.color === 'neutral' && 'bg-neutral-400'
          )}
        />

        <CardContent className="p-5 pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-medium',
                    typeMetadata.color === 'emerald' && 'bg-emerald-50 text-emerald-700',
                    typeMetadata.color === 'blue' && 'bg-blue-50 text-blue-700',
                    typeMetadata.color === 'purple' && 'bg-purple-50 text-purple-700',
                    typeMetadata.color === 'amber' && 'bg-amber-50 text-amber-700',
                    typeMetadata.color === 'rose' && 'bg-rose-50 text-rose-700'
                  )}
                >
                  {typeMetadata.label}
                </Badge>
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
                    statusMetadata.color === 'neutral' &&
                      'border-neutral-200 text-neutral-600 bg-neutral-50'
                  )}
                >
                  {statusMetadata.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                {campaign.name}
              </h3>
              {campaign.description && (
                <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{campaign.description}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onViewDetails(campaign)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {campaign.status === 'planning' && (
                  <DropdownMenuItem onClick={() => onStatusChange(campaign, 'active')}>
                    <Play className="h-4 w-4 mr-2 text-emerald-600" />
                    Start Campaign
                  </DropdownMenuItem>
                )}
                {campaign.status === 'active' && (
                  <DropdownMenuItem onClick={() => onStatusChange(campaign, 'paused')}>
                    <Pause className="h-4 w-4 mr-2 text-amber-600" />
                    Pause Campaign
                  </DropdownMenuItem>
                )}
                {campaign.status === 'paused' && (
                  <DropdownMenuItem onClick={() => onStatusChange(campaign, 'active')}>
                    <Play className="h-4 w-4 mr-2 text-emerald-600" />
                    Resume Campaign
                  </DropdownMenuItem>
                )}
                {(campaign.status === 'active' || campaign.status === 'paused') && (
                  <DropdownMenuItem onClick={() => onStatusChange(campaign, 'completed')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {campaign.status !== 'cancelled' && campaign.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onStatusChange(campaign, 'cancelled')}>
                    <XCircle className="h-4 w-4 mr-2 text-rose-600" />
                    Cancel Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(campaign)}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress section */}
          {campaign.goalAmount && campaign.goalAmount > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">
                  {formatCurrency(campaign.raisedAmount)} raised
                </span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(campaign.goalAmount)} goal
                </span>
              </div>
              <Progress
                value={campaign.progressPercent}
                className="h-2"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-neutral-500">
                  {campaign.progressPercent.toFixed(0)}% complete
                </span>
                {campaign.daysRemaining !== null && (
                  <span
                    className={cn(
                      'text-xs flex items-center gap-1',
                      campaign.isOverdue ? 'text-amber-600' : 'text-neutral-500'
                    )}
                  >
                    {campaign.isOverdue ? (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        {Math.abs(campaign.daysRemaining)} days overdue
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        {campaign.daysRemaining} days left
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-neutral-400" />
              <span>{campaign.donorCount} donors</span>
            </div>
            {campaign.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span>{formatDate(campaign.startDate)}</span>
                {campaign.endDate && <span>- {formatDate(campaign.endDate)}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
