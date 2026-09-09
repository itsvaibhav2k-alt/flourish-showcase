'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, ExternalLink, Check, X } from 'lucide-react'
import { approveAndSend } from '../actions/approve-and-send'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface DraftPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: {
    id: string
    subject: string
    body: string
    contactName: string
    emailType: string
    contactId: string | null
  } | null
}

export function DraftPreviewSheet({
  open,
  onOpenChange,
  draft,
}: DraftPreviewSheetProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)

  const handleApproveAndSend = async () => {
    if (!draft) return

    setIsApproving(true)
    try {
      const result = await approveAndSend(draft.id)

      if (result.success) {
        toast.success('Email approved and sent successfully!')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve and send email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error approving and sending:', error)
    } finally {
      setIsApproving(false)
    }
  }

  if (!draft) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-xl">Email Preview</SheetTitle>
              <SheetDescription className="mt-1">
                Review and approve this AI-generated email
              </SheetDescription>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {draft.emailType.replace(/_/g, ' ')}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Recipient Info */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  To: {draft.contactName}
                </p>
                <p className="text-xs text-neutral-500">Recipient</p>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                Subject
              </label>
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-sm text-neutral-900">{draft.subject}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-2">
                Message
              </label>
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="prose prose-sm max-w-none">
                  {draft.body.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-sm text-neutral-900 mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={handleApproveAndSend}
                disabled={isApproving}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isApproving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Approve & Send
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving}
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>

            <Link
              href={`/communications/drafts/${draft.id}`}
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              <Button
                variant="ghost"
                className="w-full text-neutral-600 hover:text-neutral-900"
                disabled={isApproving}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit in Communications
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
