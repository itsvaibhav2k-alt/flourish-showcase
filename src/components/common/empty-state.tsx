import * as React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FeatureCard {
  icon: LucideIcon
  title: string
  description: string
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
    keyboardShortcut?: string
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  featureCards?: FeatureCard[]
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  featureCards,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {/* Icon with subtle background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-50 blur-xl scale-150" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-white border border-neutral-200/60 shadow-sm">
          <Icon className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title - larger and bolder with Instrument Serif */}
      <h3 className="font-instrument-serif text-2xl font-medium text-neutral-900 mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description - refined hierarchy */}
      <p className="text-sm text-neutral-500 mb-8 max-w-md leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {action && (
          action.href ? (
            <Button asChild variant="primary" className="min-w-[140px]">
              <Link href={action.href} className="flex items-center gap-2">
                {action.label}
                {action.keyboardShortcut && (
                  <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/70">
                    {action.keyboardShortcut}
                  </kbd>
                )}
              </Link>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={action.onClick}
              className="min-w-[140px]"
            >
              <span className="flex items-center gap-2">
                {action.label}
                {action.keyboardShortcut && (
                  <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/70">
                    {action.keyboardShortcut}
                  </kbd>
                )}
              </span>
            </Button>
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Button asChild variant="ghost" className="text-neutral-600">
              <Link href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="text-neutral-600"
            >
              {secondaryAction.label}
            </Button>
          )
        )}
      </div>

      {/* Optional feature cards (Stripe-inspired) */}
      {featureCards && featureCards.length > 0 && (
        <div className="mt-12 w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featureCards.map((card, index) => (
              <div
                key={index}
                className="group relative rounded-[16px] border border-neutral-200 bg-white p-5 text-left hover-lift hover:border-neutral-300 hover:shadow-card-hover"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-neutral-100 group-hover:bg-neutral-50 transition-colors duration-150">
                  <card.icon className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">
                  {card.title}
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* Compact variant for inline empty states */
interface CompactEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function CompactEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: CompactEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 mb-3">
        <Icon className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-neutral-700 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-neutral-500 mb-3 max-w-xs">{description}</p>
      )}
      {action && (
        action.href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}
