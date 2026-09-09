import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-[8px] border bg-white px-4 py-2 text-sm text-neutral-900',
          // Border styles
          'border-neutral-200',
          // Placeholder
          'placeholder:text-neutral-400',
          // File input styles
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Focus styles - unified ring-2 to match buttons
          'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20',
          // Hover state
          'hover:border-neutral-300 transition-colors duration-150',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
          // Shadow for depth
          'shadow-xs',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// Premium floating label input component
export type FloatingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value !== '')
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '')
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue || props.value

    return (
      <div className="relative">
        <input
          type={type}
          id={id}
          className={cn(
            // Base styles
            'peer flex h-14 w-full rounded-[12px] border bg-white px-4 pt-5 pb-2 text-sm text-neutral-900',
            // Border styles
            'border-neutral-200',
            // Placeholder (hidden when using floating label)
            'placeholder:text-transparent',
            // File input styles
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            // Focus styles - unified ring-2 to match buttons
            'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20',
            // Hover state
            'hover:border-neutral-300 transition-colors duration-150',
            // Disabled state
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',
            // Shadow for depth
            'shadow-xs',
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder={label}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'absolute left-4 transition-all duration-200 pointer-events-none',
            'text-neutral-500',
            isFloating
              ? 'top-2 text-xs font-medium text-primary-600'
              : 'top-1/2 -translate-y-1/2 text-sm'
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'

export { Input, FloatingInput }
