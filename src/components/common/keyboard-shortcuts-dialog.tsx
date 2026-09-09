'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavigationShortcuts, useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const navigationShortcuts = useNavigationShortcuts()

  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: navigationShortcuts.filter(s => s.keys[0] === 'g'),
    },
    {
      title: 'Create',
      shortcuts: navigationShortcuts.filter(s => s.keys[0] === 'n'),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-neutral-500 mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-700">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <React.Fragment key={key}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 rounded">
                            {key.toUpperCase()}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
                            <span className="text-neutral-400 text-xs">then</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Show this help</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 rounded">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Provider component that enables keyboard shortcuts globally
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = React.useState(false)

  // Register navigation shortcuts
  useNavigationShortcuts()

  // Register help shortcut
  useKeyboardShortcuts([
    {
      keys: ['?'],
      description: 'Show keyboard shortcuts',
      action: () => setHelpOpen(true),
    },
  ])

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
