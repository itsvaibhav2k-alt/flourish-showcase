'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DemoBanner, DemoBannerMode } from './demo-banner'
import { seedDemoData } from '@/modules/settings/actions/seed-demo-data'
import { clearDemoData } from '@/modules/settings/actions/clear-demo-data'
import { toast } from 'sonner'

interface DemoBannerWrapperProps {
  /** Whether to show the banner at all */
  showBanner: boolean
  /** Whether demo data currently exists (contacts with demo-data tag) */
  hasDemoData: boolean
}

export function DemoBannerWrapper({ showBanner, hasDemoData }: DemoBannerWrapperProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<DemoBannerMode>(hasDemoData ? 'delete' : 'load')
  const [isHidden, setIsHidden] = useState(false)
  const router = useRouter()

  // Don't show banner if it's not supposed to be shown or has been hidden
  if (!showBanner || isHidden) {
    return null
  }

  const handleLoadDemo = async () => {
    setIsLoading(true)

    try {
      const result = await seedDemoData()

      if (result.success && result.summary) {
        toast.success('Sample data loaded successfully!', {
          description: `Added ${result.summary.contacts} contacts, ${result.summary.gifts} gifts, ${result.summary.shifts} shifts, and ${result.summary.drafts} email drafts.`,
          duration: 5000,
        })

        // Switch to delete mode
        setMode('delete')

        // Refresh the page to show new data
        router.refresh()
      } else {
        toast.error('Failed to load sample data', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      console.error('Error loading demo data:', error)
      toast.error('Failed to load sample data', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDemo = async () => {
    setIsLoading(true)

    try {
      const result = await clearDemoData()

      if (result.success) {
        toast.success('Sample data deleted', {
          description: result.message || 'All demo data has been cleared. You can now add your own contacts.',
          duration: 5000,
        })

        // Hide the banner completely after delete
        setIsHidden(true)

        // Refresh the page to show empty state
        router.refresh()
      } else {
        toast.error('Failed to delete sample data', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      console.error('Error deleting demo data:', error)
      toast.error('Failed to delete sample data', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DemoBanner
      mode={mode}
      onLoadDemo={handleLoadDemo}
      onDeleteDemo={handleDeleteDemo}
      isLoading={isLoading}
    />
  )
}
