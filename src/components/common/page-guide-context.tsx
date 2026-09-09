'use client'

import * as React from 'react'
import { createContext, useContext, useState, useCallback } from 'react'

interface PageGuideContextValue {
  openGuide: (pageKey: string) => void
  closeGuide: () => void
  isOpen: boolean
  currentPage: string | null
}

const PageGuideContext = createContext<PageGuideContextValue | undefined>(undefined)

export function PageGuideProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<string | null>(null)

  const openGuide = useCallback((pageKey: string) => {
    setCurrentPage(pageKey)
    setIsOpen(true)
  }, [])

  const closeGuide = useCallback(() => {
    setIsOpen(false)
    // Keep currentPage for a moment to allow smooth transition
    setTimeout(() => {
      if (!isOpen) {
        setCurrentPage(null)
      }
    }, 300)
  }, [isOpen])

  const value = React.useMemo(
    () => ({
      openGuide,
      closeGuide,
      isOpen,
      currentPage,
    }),
    [openGuide, closeGuide, isOpen, currentPage]
  )

  return (
    <PageGuideContext.Provider value={value}>
      {children}
    </PageGuideContext.Provider>
  )
}

export function usePageGuide() {
  const context = useContext(PageGuideContext)
  if (context === undefined) {
    throw new Error('usePageGuide must be used within a PageGuideProvider')
  }
  return context
}
