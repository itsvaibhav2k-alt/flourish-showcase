'use client'

import * as React from 'react'
import { usePageGuide } from './page-guide-context'
import { PageGuideSidebar } from './page-guide-sidebar'

/**
 * PageGuideWrapper - Connects the sidebar to the context
 * Place this at the app level to enable page guides
 */
export function PageGuideWrapper() {
  const { isOpen, currentPage, closeGuide } = usePageGuide()

  if (!currentPage) {
    return null
  }

  return (
    <PageGuideSidebar
      pageKey={currentPage}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeGuide()
        }
      }}
    />
  )
}
