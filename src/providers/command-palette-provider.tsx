'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface CommandPaletteContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (context === undefined) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider')
  }
  return context
}
