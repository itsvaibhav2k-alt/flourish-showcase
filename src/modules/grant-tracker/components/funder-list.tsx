'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Funder } from '../schemas/funder.schema'
import { FUNDER_TYPE_METADATA, RELATIONSHIP_STATUS_METADATA } from '../schemas/funder.schema'

interface FunderListProps {
  funders: Funder[]
  onEdit?: (funder: Funder) => void
  onDelete?: (funder: Funder) => void
  onView?: (funder: Funder) => void
}

export function FunderList({ funders, onEdit, onDelete, onView }: FunderListProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === 0) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {funders.map((funder, index) => {
        const statusMetadata = RELATIONSHIP_STATUS_METADATA[funder.relationshipStatus]
        const typeMetadata = funder.type ? FUNDER_TYPE_METADATA[funder.type] : null

        return (
          <div key={funder.id}>
            <Card
              className="relative overflow-hidden transition-colors duration-150 cursor-pointer shadow-card border-neutral-200/60 bg-white hover:border-neutral-300"
              onClick={() => onView?.(funder)}
            >
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-1',
                  statusMetadata.color === 'emerald' && 'bg-emerald-500',
                  statusMetadata.color === 'blue' && 'bg-blue-500',
                  statusMetadata.color === 'amber' && 'bg-amber-500',
                  statusMetadata.color === 'purple' && 'bg-purple-500',
                  statusMetadata.color === 'rose' && 'bg-rose-500',
                  statusMetadata.color === 'neutral' && 'bg-neutral-400'
                )}
              />

              <CardContent className="p-5 pt-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          statusMetadata.color === 'emerald' &&
                            'border-emerald-200 text-emerald-700 bg-emerald-50',
                          statusMetadata.color === 'blue' &&
                            'border-blue-200 text-blue-700 bg-blue-50',
                          statusMetadata.color === 'amber' &&
                            'border-amber-200 text-amber-700 bg-amber-50',
                          statusMetadata.color === 'purple' &&
                            'border-purple-200 text-purple-700 bg-purple-50',
                          statusMetadata.color === 'rose' &&
                            'border-rose-200 text-rose-700 bg-rose-50',
                          statusMetadata.color === 'neutral' &&
                            'border-neutral-200 text-neutral-600 bg-neutral-50'
                        )}
                      >
                        {statusMetadata.label}
                      </Badge>
                      {typeMetadata && (
                        <Badge variant="secondary" className="text-xs">
                          {typeMetadata.label}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-neutral-900 truncate mb-1 group-hover:text-primary-700 transition-colors">
                      {funder.name}
                    </h3>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => onView?.(funder)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(funder)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Funder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(funder)}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Funder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-3">
                  {funder.contactName && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      <span className="truncate">{funder.contactName}</span>
                    </div>
                  )}
                  {funder.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Mail className="h-4 w-4 text-neutral-400" />
                      <span className="truncate">{funder.contactEmail}</span>
                    </div>
                  )}
                  {funder.contactPhone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      <span>{funder.contactPhone}</span>
                    </div>
                  )}
                  {funder.website && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Globe className="h-4 w-4 text-neutral-400" />
                      <a
                        href={funder.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="truncate hover:text-primary-600 underline"
                      >
                        {funder.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {(funder.totalAwarded || funder.averageGrantSize) && (
                  <div className="flex items-center gap-4 pt-3 border-t border-neutral-100">
                    {funder.totalAwarded && funder.totalAwarded > 0 && (
                      <div className="text-sm">
                        <span className="text-neutral-500">Total Awarded: </span>
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(funder.totalAwarded)}
                        </span>
                      </div>
                    )}
                    {funder.averageGrantSize && (
                      <div className="text-sm">
                        <span className="text-neutral-500">Avg: </span>
                        <span className="font-medium text-neutral-700">
                          {formatCurrency(funder.averageGrantSize)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Focus areas */}
                {funder.focusAreas && funder.focusAreas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="flex flex-wrap gap-1">
                      {funder.focusAreas.slice(0, 3).map((area, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-xs bg-neutral-100 text-neutral-600"
                        >
                          {area}
                        </Badge>
                      ))}
                      {funder.focusAreas.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-neutral-100">
                          +{funder.focusAreas.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
