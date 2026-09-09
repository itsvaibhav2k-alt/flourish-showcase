'use client'

import type { EmailDraft } from '../schemas/email.schema'
import { getEmailTypeLabel } from '../schemas/email.schema'
import { formatDistanceToNow } from '@/lib/utils/date'
import { Mail, Gift, Heart, Clock } from 'lucide-react'

type DraftCardProps = {
  draft: EmailDraft
  recipientName?: string
  selected?: boolean
  onClick?: () => void
}

const emailTypeIcons: Record<string, typeof Mail> = {
  thank_you: Gift,
  re_engagement: Heart,
  volunteer_reminder: Clock,
}

export function DraftCard({ draft, recipientName, selected, onClick }: DraftCardProps) {
  const Icon = emailTypeIcons[draft.email_type] || Mail

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-all
        ${selected
          ? 'bg-violet-50 border-violet-300 shadow-sm'
          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-1.5 rounded-md mt-0.5
          ${selected ? 'bg-violet-100 text-violet-600' : 'bg-neutral-100 text-neutral-500'}
        `}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${selected ? 'text-violet-900' : 'text-neutral-900'}`}>
            {recipientName || 'Unknown Recipient'}
          </p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {draft.subject}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
            <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
              {getEmailTypeLabel(draft.email_type)}
            </span>
            <span suppressHydrationWarning>{formatDistanceToNow(draft.created_at)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
