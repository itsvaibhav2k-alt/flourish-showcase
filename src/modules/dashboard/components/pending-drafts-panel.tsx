'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Eye, Check, ArrowRight, Sparkles } from 'lucide-react'
import { DraftPreviewSheet } from './draft-preview-sheet'
import { approveAndSend } from '../actions/approve-and-send'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import type { PendingDraft } from '../queries/get-pending-drafts'
import { getEmailTypeLabel } from '@/modules/communications/schemas/email.schema'

interface PendingDraftsPanelProps {
  drafts: PendingDraft[]
}

export function PendingDraftsPanel({ drafts }: PendingDraftsPanelProps) {
  const router = useRouter()
  const [selectedDraft, setSelectedDraft] = useState<PendingDraft | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handlePreview = (draft: PendingDraft) => {
    setSelectedDraft(draft)
    setSheetOpen(true)
  }

  const handleApproveAndSend = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setApprovingId(draftId)

    try {
      const result = await approveAndSend(draftId)

      if (result.success) {
        toast.success('Email approved and sent successfully!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve and send email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error approving and sending:', error)
    } finally {
      setApprovingId(null)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (drafts.length === 0) {
    return (
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              Pending Drafts
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No pending drafts</p>
            <p className="text-xs text-neutral-400 mt-1">
              AI-generated emails will appear here for review
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              Pending Drafts
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                {drafts.length}
              </span>
            </CardTitle>
            <Link
              href="/communications"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 hover:bg-neutral-50/50 transition-fast"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {draft.contactName}
                      </p>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {getEmailTypeLabel(draft.emailType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 font-medium mb-1 truncate">
                      {draft.subject}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {draft.bodyPreview}...
                    </p>
                    <p className="text-xs text-neutral-400 mt-2">
                      {formatTimeAgo(draft.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(draft)}
                    className="flex-1 text-neutral-700 hover:text-neutral-900 border-neutral-200"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => handleApproveAndSend(draft.id, e)}
                    disabled={approvingId === draft.id}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    {approvingId === draft.id ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Approve & Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DraftPreviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        draft={
          selectedDraft
            ? {
                id: selectedDraft.id,
                subject: selectedDraft.subject,
                body: selectedDraft.body,
                contactName: selectedDraft.contactName,
                emailType: selectedDraft.emailType,
                contactId: selectedDraft.contactId,
              }
            : null
        }
      />
    </>
  )
}
