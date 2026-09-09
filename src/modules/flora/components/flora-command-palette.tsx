'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { cn } from '@/lib/utils'
import {
  Search,
  Mail,
  GitBranch,
  MessageSquare,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  Command as CommandIcon,
  Lightbulb,
} from 'lucide-react'

interface FloraCommandPaletteProps {
  onGenerateSuggestions?: () => void
}

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
  group: 'navigation' | 'actions'
}

export function FloraCommandPalette({
  onGenerateSuggestions,
}: FloraCommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  // Toggle command palette with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false)
    setSearch('')
    callback()
  }, [])

  const commands: CommandItem[] = [
    // Navigation commands
    {
      id: 'flora-home',
      label: 'Go to Flora Home',
      icon: <Sparkles className="h-4 w-4" />,
      onSelect: () => router.push('/flora'),
      group: 'navigation',
    },
    {
      id: 'compose',
      label: 'Compose Email',
      icon: <Mail className="h-4 w-4" />,
      onSelect: () => router.push('/flora/compose'),
      group: 'navigation',
    },
    {
      id: 'sequences',
      label: 'Email Sequences',
      icon: <GitBranch className="h-4 w-4" />,
      onSelect: () => router.push('/flora/sequences'),
      group: 'navigation',
    },
    {
      id: 'ask',
      label: 'Ask Flora',
      icon: <MessageSquare className="h-4 w-4" />,
      onSelect: () => router.push('/flora/ask'),
      group: 'navigation',
    },
    {
      id: 'smart-ask',
      label: 'Smart Ask Calculator',
      icon: <DollarSign className="h-4 w-4" />,
      onSelect: () => router.push('/flora/smart-ask'),
      group: 'navigation',
    },
    {
      id: 'grants',
      label: 'Grant Writer',
      icon: <FileText className="h-4 w-4" />,
      onSelect: () => router.push('/flora/grants'),
      group: 'navigation',
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: <BarChart3 className="h-4 w-4" />,
      onSelect: () => router.push('/flora/insights'),
      group: 'navigation',
    },
    {
      id: 'settings',
      label: 'AI Settings',
      icon: <Settings className="h-4 w-4" />,
      onSelect: () => router.push('/flora/settings'),
      group: 'navigation',
    },
  ]

  // Add action commands if callback is provided
  if (onGenerateSuggestions) {
    commands.push({
      id: 'generate-suggestions',
      label: 'Generate Suggestions',
      icon: <Lightbulb className="h-4 w-4" />,
      onSelect: onGenerateSuggestions,
      group: 'actions',
    })
  }

  const navigationCommands = commands.filter((cmd) => cmd.group === 'navigation')
  const actionCommands = commands.filter((cmd) => cmd.group === 'actions')

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <CommandIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Quick navigation</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <Command
              className="pointer-events-auto w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 slide-in-from-top-[48%] duration-200"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setOpen(false)
                }
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Search className="h-5 w-5 text-gray-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search commands..."
                  className="flex-1 outline-none text-base placeholder:text-gray-400 bg-transparent"
                  autoFocus
                />
              </div>

              {/* Command List */}
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                {/* Navigation Group */}
                {navigationCommands.length > 0 && (
                  <Command.Group
                    heading="Navigation"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {navigationCommands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={command.label}
                        onSelect={() => handleSelect(command.onSelect)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                          'text-sm text-gray-700',
                          'data-[selected=true]:bg-violet-50 data-[selected=true]:text-violet-900',
                          'outline-none'
                        )}
                      >
                        <div className="flex-shrink-0 text-violet-600">
                          {command.icon}
                        </div>
                        <span className="flex-1">{command.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Actions Group */}
                {actionCommands.length > 0 && (
                  <Command.Group
                    heading="Actions"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {actionCommands.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={command.label}
                        onSelect={() => handleSelect(command.onSelect)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                          'text-sm text-gray-700',
                          'data-[selected=true]:bg-violet-50 data-[selected=true]:text-violet-900',
                          'outline-none'
                        )}
                      >
                        <div className="flex-shrink-0 text-violet-600">
                          {command.icon}
                        </div>
                        <span className="flex-1">{command.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                <span>Navigate with arrow keys</span>
                <span>Press ESC to close</span>
              </div>
            </Command>
          </div>
        </>
      )}
    </>
  )
}
