import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, ArrowRight, User } from 'lucide-react'
import type { StageHistoryEntry } from '../queries/get-stage-history'
import { cn } from '@/lib/utils'

interface StageHistoryProps {
  history: StageHistoryEntry[]
}

const STAGE_CONFIG = {
  identification: {
    name: 'Identification',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  qualification: {
    name: 'Qualification',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  cultivation: {
    name: 'Cultivation',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  solicitation: {
    name: 'Solicitation',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  stewardship: {
    name: 'Stewardship',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
} as const

export function StageHistory({ history }: StageHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDaysAgo = (dateString: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  if (history.length === 0) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-neutral-400" />
            <h3 className="text-sm font-medium text-neutral-700">Stage History</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-neutral-500 text-center py-4">
            No stage history available
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-medium text-neutral-700">Stage History</h3>
          <Badge variant="secondary" className="text-xs">
            {history.length} {history.length === 1 ? 'entry' : 'entries'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {history.map((entry, index) => {
            const isLast = index === history.length - 1
            const fromConfig = entry.from_stage
              ? STAGE_CONFIG[entry.from_stage]
              : null
            const toConfig = STAGE_CONFIG[entry.to_stage]

            return (
              <div key={entry.id} className="relative">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-3 top-10 bottom-0 w-px bg-neutral-200" />
                )}

                <div className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 z-10 mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    {/* Stage transition */}
                    <div className="flex items-center gap-2 mb-1">
                      {fromConfig ? (
                        <>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', fromConfig.color)}
                          >
                            {fromConfig.name}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-neutral-400" />
                        </>
                      ) : (
                        <span className="text-xs text-neutral-500">Added to</span>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', toConfig.color)}
                      >
                        {toConfig.name}
                      </Badge>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-neutral-500 mb-1">
                      {formatDate(entry.created_at)} • {formatDaysAgo(entry.created_at)}
                    </p>

                    {/* Changed by */}
                    {entry.changed_by_user && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 mb-1">
                        <User className="h-3 w-3" />
                        <span>{entry.changed_by_user.name}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes && (
                      <p className="text-xs text-neutral-600 mt-2 p-2 rounded bg-neutral-50 border border-neutral-100">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
