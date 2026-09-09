'use client'

import type { EmailDraft } from '../schemas/email.schema'
import { getEmailTypeLabel } from '../schemas/email.schema'
import { formatDateTime } from '@/lib/utils/date'
import { Mail, User, Pencil, Gift, Heart, Clock } from 'lucide-react'

type EmailPreviewProps = {
  draft: EmailDraft
  recipientName?: string
  recipientEmail?: string
  isEditMode?: boolean
  onToggleEdit?: () => void
}

const emailTypeIcons: Record<string, typeof Mail> = {
  thank_you: Gift,
  re_engagement: Heart,
  volunteer_reminder: Clock,
}

export function EmailPreview({
  draft,
  recipientName,
  recipientEmail,
  isEditMode,
  onToggleEdit,
}: EmailPreviewProps) {
  const Icon = emailTypeIcons[draft.email_type] || Mail

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Email header - styled like actual email client */}
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 rounded-md">
                <Icon className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">
                {getEmailTypeLabel(draft.email_type)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-neutral-400" />
              <span className="font-medium text-neutral-900">{recipientName || 'Unknown Recipient'}</span>
              {recipientEmail && (
                <span className="text-neutral-500">&lt;{recipientEmail}&gt;</span>
              )}
            </div>
          </div>
          {onToggleEdit && (draft.status === 'pending' || draft.status === 'draft') && (
            <button
              onClick={onToggleEdit}
              className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Subject line */}
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-lg font-semibold text-neutral-900">{draft.subject}</h2>
        <p className="text-xs text-neutral-400 mt-1" suppressHydrationWarning>
          Created {formatDateTime(draft.created_at)}
        </p>
      </div>

      {/* Email body */}
      <div className="px-6 py-6">
        <div className="prose prose-neutral prose-sm max-w-none">
          {draft.body.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index} className="text-neutral-700 leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ) : <br key={index} />
          ))}
        </div>
      </div>

      {/* Footer with status */}
      {(draft.reviewed_at || draft.sent_at) && (
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {draft.reviewed_at && (
              <span suppressHydrationWarning>Reviewed {formatDateTime(draft.reviewed_at)}</span>
            )}
            {draft.sent_at && (
              <span className="flex items-center gap-1" suppressHydrationWarning>
                <Mail className="h-3 w-3" />
                Sent {formatDateTime(draft.sent_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
