'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FloraMascot } from '@/components/common/flora-mascot'
import { getPageGuide, PageGuide } from '@/lib/content/page-guides'
import { cn } from '@/lib/utils'

interface PageGuideSidebarProps {
  pageKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper to get the icon component from the string name
function getIconComponent(iconName: string) {
  // Convert kebab-case to PascalCase (e.g., "bar-chart-2" -> "BarChart2")
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // Get the icon from lucide-react
  const Icon = (LucideIcons as any)[pascalCase]
  return Icon || LucideIcons.HelpCircle // Fallback to HelpCircle
}

export function PageGuideSidebar({
  pageKey,
  open,
  onOpenChange,
}: PageGuideSidebarProps) {
  // Get content for this page
  const content = getPageGuide(pageKey)

  // Store open/closed state in localStorage
  useEffect(() => {
    if (open !== undefined && pageKey) {
      try {
        localStorage.setItem(`page-guide-${pageKey}`, open ? 'open' : 'closed')
      } catch (error) {
        // Silently fail if localStorage is not available
        console.error('Failed to save page guide state:', error)
      }
    }
  }, [open, pageKey])

  // Load initial state from localStorage
  useEffect(() => {
    if (pageKey && open === undefined) {
      try {
        const savedState = localStorage.getItem(`page-guide-${pageKey}`)
        if (savedState === 'open') {
          onOpenChange(true)
        }
      } catch (error) {
        // Silently fail if localStorage is not available
        console.error('Failed to load page guide state:', error)
      }
    }
  }, [pageKey, open, onOpenChange])

  // If no content found, don't render
  if (!content) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <FloraMascot size="sm" state="explaining" />
            <div className="flex-1">
              <SheetTitle className="text-lg font-semibold text-neutral-900">
                How to use this page
              </SheetTitle>
              <SheetDescription className="text-sm text-neutral-600 mt-1">
                {content.title}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Purpose Section */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Purpose
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {content.purpose}
            </p>
          </section>

          {/* Key Features Section */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Key Features
            </h3>
            <div className="space-y-3">
              {content.keyFeatures.map((feature, index) => {
                const Icon = getIconComponent(feature.icon)
                return (
                  <div key={index} className="flex gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        'bg-gradient-to-br from-primary-50 to-primary-100'
                      )}
                    >
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-900 mb-0.5">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Best Practices Section */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Best Practices
            </h3>
            <ul className="space-y-2">
              {content.bestPractices.map((practice, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-neutral-600 leading-relaxed"
                >
                  <span className="text-primary-600 mt-0.5 shrink-0">•</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tips Section */}
          {content.tips && content.tips.length > 0 && (
            <section>
              <div
                className={cn(
                  'rounded-lg p-4',
                  'bg-amber-50 border border-amber-100'
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-900">
                    Pro Tips
                  </h3>
                </div>
                <ul className="space-y-2 ml-6">
                  {content.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-sm text-amber-800 leading-relaxed"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
