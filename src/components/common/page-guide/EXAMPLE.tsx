/**
 * Example Integration of Page Guide System
 *
 * This file shows how to integrate the page guide components
 * into your Flourish application.
 */

// ============================================
// 1. APP LAYOUT SETUP (do this once)
// ============================================

// File: src/app/layout.tsx (or your root layout)
import { PageGuideProvider } from '@/components/common/page-guide'
import { PageGuideWrapper } from '@/components/common/page-guide'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PageGuideProvider>
          {children}
          {/* This renders the sidebar based on context state */}
          <PageGuideWrapper />
        </PageGuideProvider>
      </body>
    </html>
  )
}

// ============================================
// 2. PAGE INTEGRATION (in any page)
// ============================================

// File: src/app/(dashboard)/donors/page.tsx
import { PageGuideTrigger } from '@/components/common/page-guide'

export default function DonorsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header with Guide Trigger */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Donors</h1>
          <p className="text-sm text-neutral-600">
            Manage donor relationships and track giving
          </p>
        </div>

        {/* Add the trigger button - pageKey must match page-guides.ts */}
        <PageGuideTrigger pageKey="donors" />
      </header>

      {/* Rest of your page content */}
      <div className="grid gap-4">
        {/* Your donor list, stats, etc. */}
      </div>
    </div>
  )
}

// ============================================
// 3. PROGRAMMATIC CONTROL (optional)
// ============================================

// File: src/components/features/onboarding-tour.tsx
'use client'

import { usePageGuide } from '@/components/common/page-guide'
import { Button } from '@/components/ui/button'

export function OnboardingTour() {
  const { openGuide } = usePageGuide()

  const handleStartTour = () => {
    // Open the dashboard guide programmatically
    openGuide('dashboard')
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="font-semibold mb-2">Welcome to Flourish!</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Let's take a quick tour of the dashboard
      </p>
      <Button onClick={handleStartTour}>
        Start Tour
      </Button>
    </div>
  )
}

// ============================================
// 4. PAGE HEADER COMPONENT (reusable)
// ============================================

// File: src/components/layouts/page-header.tsx
import { PageGuideTrigger } from '@/components/common/page-guide'
import { hasPageGuide } from '@/lib/content/page-guides'

interface PageHeaderProps {
  title: string
  description?: string
  pageKey?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  pageKey,
  actions
}: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-600 mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        {/* Only show guide trigger if this page has a guide */}
        {pageKey && hasPageGuide(pageKey) && (
          <PageGuideTrigger pageKey={pageKey} />
        )}
      </div>
    </header>
  )
}

// Usage in a page:
export function VolunteersPageExample() {
  return (
    <div className="p-6">
      <PageHeader
        title="Volunteers"
        description="Manage shifts and track volunteer engagement"
        pageKey="volunteers"
        actions={
          <Button>Create Shift</Button>
        }
      />
      {/* Page content */}
    </div>
  )
}
