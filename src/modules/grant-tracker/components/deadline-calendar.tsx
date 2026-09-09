'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertTriangle, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GrantWithMeta } from '../queries'

interface DeadlineCalendarProps {
  grants: GrantWithMeta[]
  onGrantClick?: (grant: GrantWithMeta) => void
}

export function DeadlineCalendar({ grants, onGrantClick }: DeadlineCalendarProps) {
  const deadlineGrants = useMemo(() => {
    const now = new Date()
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return grants
      .filter((g) => {
        if (!g.deadline) return false
        const deadline = new Date(g.deadline)
        return (
          deadline >= now &&
          deadline <= nextMonth &&
          (g.status === 'researching' || g.status === 'writing' || g.status === 'draft')
        )
      })
      .sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
  }, [grants])

  const groupedByWeek = useMemo(() => {
    const now = new Date()
    const groups: {
      label: string
      grants: GrantWithMeta[]
      urgent: boolean
    }[] = [
      { label: 'This Week', grants: [], urgent: true },
      { label: 'Next Week', grants: [], urgent: false },
      { label: 'Next 2-4 Weeks', grants: [], urgent: false },
    ]

    deadlineGrants.forEach((grant) => {
      if (!grant.deadline || grant.daysUntilDeadline === null) return

      if (grant.daysUntilDeadline <= 7) {
        groups[0].grants.push(grant)
      } else if (grant.daysUntilDeadline <= 14) {
        groups[1].grants.push(grant)
      } else if (grant.daysUntilDeadline <= 30) {
        groups[2].grants.push(grant)
      }
    })

    return groups.filter((g) => g.grants.length > 0)
  }, [deadlineGrants])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (deadlineGrants.length === 0) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">No upcoming deadlines in the next 30 days</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
          <Badge variant="outline" className="text-neutral-600">
            {deadlineGrants.length} deadline{deadlineGrants.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupedByWeek.map((group, groupIndex) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2">
                <h4
                  className={cn(
                    'text-sm font-medium',
                    group.urgent ? 'text-rose-700' : 'text-neutral-700'
                  )}
                >
                  {group.label}
                </h4>
                {group.urgent && <AlertTriangle className="h-4 w-4 text-rose-500" />}
              </div>
              <div className="space-y-2">
                {group.grants.map((grant, index) => (
                  <div
                    key={grant.id}
                    onClick={() => onGrantClick?.(grant)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        'p-3 rounded-lg border transition-all',
                        group.urgent
                          ? 'border-rose-200 bg-rose-50 hover:border-rose-300 hover:shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-neutral-900 truncate">
                              {grant.funderName}
                            </span>
                          </div>
                          {grant.grantName && (
                            <p className="text-xs text-neutral-600 truncate ml-6">
                              {grant.grantName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                group.urgent
                                  ? 'border-rose-300 text-rose-700 bg-rose-100'
                                  : 'border-amber-300 text-amber-700 bg-amber-50'
                              )}
                            >
                              {grant.daysUntilDeadline !== null &&
                                `${grant.daysUntilDeadline} day${grant.daysUntilDeadline !== 1 ? 's' : ''} left`}
                            </Badge>
                            <span className="text-xs text-neutral-500">
                              {formatDate(grant.deadline!)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
