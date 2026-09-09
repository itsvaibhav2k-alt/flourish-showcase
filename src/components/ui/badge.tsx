import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-neutral-900 text-neutral-50 hover:bg-neutral-900/80',
        secondary:
          'border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-100/80',
        destructive:
          'border-transparent bg-rose-100 text-rose-700 hover:bg-rose-100/80',
        outline:
          'bg-transparent text-neutral-700 border-neutral-300',
        'outline-destructive':
          'bg-transparent text-rose-600 border-rose-300',
        'outline-success':
          'bg-transparent text-green-600 border-green-300',
        'outline-warning':
          'bg-transparent text-amber-600 border-amber-300',
        'outline-info':
          'bg-transparent text-primary-600 border-primary-300',
        success:
          'border-transparent bg-green-100 text-green-700 hover:bg-green-100/80',
        warning:
          'border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100/80',
        info:
          'border-transparent bg-primary-100 text-primary-700 hover:bg-primary-100/80',
        teal:
          'border-transparent bg-teal-100 text-teal-700 hover:bg-teal-100/80',
        violet:
          'border-transparent bg-violet-100 text-violet-700 hover:bg-violet-100/80',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Dot color mapping for status dot variant
const dotColorMap: Record<string, string> = {
  default: 'bg-neutral-50',
  secondary: 'bg-neutral-500',
  destructive: 'bg-rose-500',
  outline: 'bg-neutral-500',
  'outline-destructive': 'bg-rose-500',
  'outline-success': 'bg-green-500',
  'outline-warning': 'bg-amber-500',
  'outline-info': 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  info: 'bg-primary-500',
  teal: 'bg-teal-500',
  violet: 'bg-violet-500',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Show a status dot before the text
   */
  dot?: boolean
  /**
   * Add a pulse animation to the dot (for "live" status)
   */
  pulse?: boolean
}

function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  const variantKey = variant || 'default'
  const dotColor = dotColorMap[variantKey] || 'bg-current'

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                dotColor
              )}
            />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotColor)} />
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
