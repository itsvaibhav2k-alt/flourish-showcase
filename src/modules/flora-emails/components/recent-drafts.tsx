'use client'

import { motion } from 'framer-motion'
import { Mail, Clock, CheckCircle, Send, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FloraEmailDraft } from '../queries'
import Link from 'next/link'

interface RecentDraftsProps {
  drafts: FloraEmailDraft[]
}

export function RecentDrafts({ drafts }: RecentDraftsProps) {
  if (drafts.length === 0) {
    return null
  }

  const getStatusBadge = (status: FloraEmailDraft['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Draft', icon: FileText },
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      approved: { variant: 'default' as const, label: 'Approved', icon: CheckCircle },
      sent: { variant: 'outline' as const, label: 'Sent', icon: Send },
      rejected: { variant: 'destructive' as const, label: 'Rejected', icon: FileText },
    }
    return variants[status] || variants.draft
  }

  return (
    <Card className="shadow-sm border-neutral-200/60 bg-white">
      <CardHeader className="border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-violet-600" />
            Recent Drafts
          </CardTitle>
          <Link href="/communications">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100">
          {drafts.map((draft, index) => {
            const statusInfo = getStatusBadge(draft.status)
            const StatusIcon = statusInfo.icon

            return (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {draft.subject}
                        </p>
                        <p className="text-xs text-neutral-500">
                          To: {draft.contactName}
                          {draft.contactEmail && (
                            <span className="ml-1 text-neutral-400">({draft.contactEmail})</span>
                          )}
                        </p>
                      </div>
                      <Badge variant={statusInfo.variant} className="flex-shrink-0">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-2 mb-2">{draft.body}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(draft.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="capitalize">{draft.emailType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
