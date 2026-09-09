'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  keys: string[]
  description: string
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options
  const sequenceRef = React.useRef<string[]>([])
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      // Clear sequence timeout and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = []
      }, 1000)

      // Add key to sequence
      sequenceRef.current.push(event.key.toLowerCase())

      // Check if sequence matches any shortcut
      for (const shortcut of shortcuts) {
        const sequence = sequenceRef.current.join('+')
        const shortcutSequence = shortcut.keys.join('+')

        if (sequence === shortcutSequence || sequenceRef.current.join('') === shortcut.keys.join('')) {
          event.preventDefault()
          shortcut.action()
          sequenceRef.current = []
          return
        }
      }

      // If sequence is getting too long, reset
      if (sequenceRef.current.length > 3) {
        sequenceRef.current = [event.key.toLowerCase()]
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [shortcuts, enabled])
}

/**
 * Hook for common navigation shortcuts
 */
export function useNavigationShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = React.useMemo(
    () => [
      {
        keys: ['g', 'c'],
        description: 'Go to Contacts',
        action: () => router.push('/contacts'),
      },
      {
        keys: ['g', 'd'],
        description: 'Go to Donors',
        action: () => router.push('/donors'),
      },
      {
        keys: ['g', 'v'],
        description: 'Go to Volunteers',
        action: () => router.push('/volunteers'),
      },
      {
        keys: ['g', 'h'],
        description: 'Go to Dashboard',
        action: () => router.push('/'),
      },
      {
        keys: ['g', 'm'],
        description: 'Go to Communications',
        action: () => router.push('/communications'),
      },
      {
        keys: ['n', 'c'],
        description: 'New Contact',
        action: () => router.push('/contacts/new'),
      },
      {
        keys: ['n', 'g'],
        description: 'New Gift',
        action: () => router.push('/donors?action=log-gift'),
      },
      {
        keys: ['n', 's'],
        description: 'New Shift',
        action: () => router.push('/volunteers/shifts/new'),
      },
    ],
    [router]
  )

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}
