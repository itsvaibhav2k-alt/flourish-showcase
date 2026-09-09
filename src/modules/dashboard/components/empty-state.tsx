'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  variant?: 'default' | 'primary' | 'teal' | 'rose' | 'amber'
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-400',
    dotColor: 'bg-neutral-300',
    ringColor: 'ring-neutral-200/50',
  },
  primary: {
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-400',
    dotColor: 'bg-primary-300',
    ringColor: 'ring-primary-200/50',
  },
  teal: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-400',
    dotColor: 'bg-teal-300',
    ringColor: 'ring-teal-200/50',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-400',
    dotColor: 'bg-rose-300',
    ringColor: 'ring-rose-200/50',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-400',
    dotColor: 'bg-amber-300',
    ringColor: 'ring-amber-200/50',
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'h-full flex flex-col items-center justify-center py-12 px-4',
        className
      )}
    >
      {/* Animated icon container */}
      <div className="relative mb-4">
        {/* Floating dots decoration */}
        <div
          className={cn(
            'absolute -top-1 -left-1 w-2 h-2 rounded-full animate-float-slow',
            styles.dotColor
          )}
        />
        <div
          className={cn(
            'absolute -bottom-2 -right-2 w-1.5 h-1.5 rounded-full animate-float-medium',
            styles.dotColor
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 -right-3 w-1 h-1 rounded-full animate-float-fast',
            styles.dotColor
          )}
        />

        {/* Main icon circle */}
        <div
          className={cn(
            'relative h-16 w-16 rounded-2xl flex items-center justify-center',
            'ring-4 ring-offset-2 ring-offset-white',
            'animate-gentle-pulse',
            styles.iconBg,
            styles.ringColor
          )}
        >
          <Icon className={cn('h-7 w-7', styles.iconColor)} />
        </div>
      </div>

      {/* Text content */}
      <div className="text-center max-w-[200px]">
        <p className="text-sm font-semibold text-neutral-700 mb-1">{title}</p>
        <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
      </div>

      {/* Action button */}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4">
          <Button
            size="sm"
            className={cn(
              'bg-primary-600 hover:bg-primary-700 text-white',
              'transition-all duration-200',
              'hover:shadow-md hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-sm'
            )}
          >
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}
