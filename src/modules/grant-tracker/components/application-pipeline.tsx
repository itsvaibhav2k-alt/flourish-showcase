'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrantWithMeta } from '../queries'
import { GRANT_STATUS_METADATA, type GrantStatus } from '../schemas/grant.schema'

interface ApplicationPipelineProps {
  grants: GrantWithMeta[]
  onGrantClick?: (grant: GrantWithMeta) => void
}

const PIPELINE_STAGES: GrantStatus[] = [
  'researching',
  'writing',
  'draft',
  'submitted',
  'pending',
  'approved',
]

export function ApplicationPipeline({
  grants,
  onGrantClick,
}: ApplicationPipelineProps) {
  const pipelineData = useMemo(() => {
    return PIPELINE_STAGES.map((status) => {
      const stageGrants = grants.filter((g) => g.status === status)
      const totalRequested = stageGrants.reduce(
        (sum, g) => sum + (g.amountRequested || 0),
        0
      )
      const totalAwarded = stageGrants.reduce(
        (sum, g) => sum + (g.amountAwarded || 0),
        0
      )

      return {
        status,
        grants: stageGrants,
        count: stageGrants.length,
        totalRequested,
        totalAwarded,
        metadata: GRANT_STATUS_METADATA[status],
      }
    })
  }, [grants])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Grant Pipeline</h3>
        <Badge variant="outline" className="text-neutral-600">
          {grants.length} total
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {pipelineData.map((stage, index) => (
          <div key={stage.status}>
            <Card
              className="h-full shadow-card border-neutral-200/60 bg-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-neutral-700">
                    {stage.metadata.label}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs bg-neutral-100 text-neutral-700"
                  >
                    {stage.count}
                  </Badge>
                </div>
                {stage.totalRequested > 0 && (
                  <div className="text-xs text-neutral-600 mt-1">
                    {formatCurrency(stage.totalRequested)}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {stage.grants.length === 0 ? (
                      <div className="text-xs text-neutral-400 italic py-4 text-center">
                        No grants
                      </div>
                    ) : (
                      stage.grants.map((grant) => (
                        <div
                          key={grant.id}
                          onClick={() => onGrantClick?.(grant)}
                          className="cursor-pointer"
                        >
                          <div className="p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all bg-white">
                            <div className="text-xs font-medium text-neutral-900 truncate">
                              {grant.funderName}
                            </div>
                            {grant.grantName && (
                              <div className="text-xs text-neutral-500 truncate mt-0.5">
                                {grant.grantName}
                              </div>
                            )}
                            {grant.amountRequested && (
                              <div className="flex items-center gap-1 text-xs text-neutral-600 mt-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(grant.amountRequested)}
                              </div>
                            )}
                            {grant.deadline && stage.status === 'draft' && (
                              <div
                                className={cn(
                                  'text-xs mt-1',
                                  grant.isOverdue ? 'text-rose-600' : 'text-neutral-500'
                                )}
                              >
                                {grant.isOverdue
                                  ? `${Math.abs(grant.daysUntilDeadline!)}d overdue`
                                  : grant.daysUntilDeadline !== null &&
                                    grant.daysUntilDeadline <= 7
                                  ? `${grant.daysUntilDeadline}d left`
                                  : new Date(grant.deadline).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
