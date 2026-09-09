import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-neutral-900 text-neutral-50 hover:bg-neutral-800 shadow-sm',
        primary:
          'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
        destructive:
          'bg-red-600 text-neutral-50 hover:bg-red-700 shadow-sm',
        outline:
          'border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        ghost:
          'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        link: 'text-neutral-900 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 rounded-[8px] px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg: 'h-11 rounded-[12px] px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8 rounded-[8px]',
        'icon-lg': 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Keyboard shortcut to display (e.g., "K", "Ctrl+S")
   */
  kbd?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, kbd, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {kbd && (
              <kbd className="ml-1 hidden text-[10px] font-mono bg-white/20 border border-white/20 rounded px-1.5 py-0.5 sm:inline-block">
                {kbd}
              </kbd>
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
