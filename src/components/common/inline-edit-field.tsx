'use client'

import * as React from 'react'
import { Check, X, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InlineEditFieldProps {
  value: string
  onSave: (value: string) => Promise<void> | void
  label?: string
  placeholder?: string
  className?: string
  inputClassName?: string
  displayClassName?: string
  type?: 'text' | 'email' | 'tel' | 'url'
  disabled?: boolean
}

/**
 * Inline Editable Field - Stripe-inspired click-to-edit pattern
 * Features: smooth transition between view/edit modes, save/cancel actions
 */
export function InlineEditField({
  value,
  onSave,
  label,
  placeholder = 'Click to edit',
  className,
  inputClassName,
  displayClassName,
  type = 'text',
  disabled = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Sync with external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  const handleStartEditing = () => {
    if (disabled) return
    setEditValue(value)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      // Reset to original value on error
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {label && (
          <span className="text-xs text-neutral-500 w-20 shrink-0">{label}</span>
        )}
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={cn(
              'h-8 text-sm py-1 px-2',
              inputClassName
            )}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-neutral-600"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 cursor-pointer',
        disabled && 'cursor-default',
        className
      )}
      onClick={handleStartEditing}
    >
      {label && (
        <span className="text-xs text-neutral-500 w-20 shrink-0">{label}</span>
      )}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span
          className={cn(
            'text-sm text-neutral-900 truncate',
            !value && 'text-neutral-400 italic',
            !disabled && 'group-hover:text-primary-600 transition-colors',
            displayClassName
          )}
        >
          {value || placeholder}
        </span>
        {!disabled && (
          <Pencil className="h-3 w-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
    </div>
  )
}
