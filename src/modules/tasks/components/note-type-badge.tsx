'use client'

import {
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  Heart,
  Users,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteType } from '../schemas/task.schema'

interface NoteTypeBadgeProps {
  type: NoteType
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const TYPE_CONFIG: Record<
  NoteType,
  { label: string; icon: typeof Calendar; bgColor: string; textColor: string }
> = {
  meeting: {
    label: 'Meeting',
    icon: Calendar,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  phone_call: {
    label: 'Phone Call',
    icon: Phone,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  email: {
    label: 'Email',
    icon: Mail,
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
  },
  personal_info: {
    label: 'Personal Info',
    icon: User,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  follow_up: {
    label: 'Follow-up',
    icon: Clock,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  donation: {
    label: 'Donation',
    icon: Heart,
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
  volunteer: {
    label: 'Volunteer',
    icon: Users,
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
  general: {
    label: 'General',
    icon: StickyNote,
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-700',
  },
}

export function NoteTypeBadge({
  type,
  size = 'sm',
  showLabel = true,
  className,
}: NoteTypeBadgeProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.general
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export function NoteImportanceBadge({
  importance,
  size = 'sm',
  className,
}: {
  importance: 'low' | 'normal' | 'high' | 'urgent'
  size?: 'sm' | 'md'
  className?: string
}) {
  const config: Record<string, { label: string; bgColor: string; textColor: string }> = {
    low: { label: 'Low', bgColor: 'bg-neutral-100', textColor: 'text-neutral-600' },
    normal: { label: 'Normal', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    high: { label: 'High', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    urgent: { label: 'Urgent', bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  }

  const { label, bgColor, textColor } = config[importance] || config.normal

  // Don't show badge for normal importance
  if (importance === 'normal') return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        bgColor,
        textColor,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {importance === 'urgent' && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
      )}
      {importance === 'high' && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
      )}
      {label}
    </span>
  )
}
