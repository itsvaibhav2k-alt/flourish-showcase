'use client'

import { Suspense, useState, useEffect } from 'react'
import { SmartAskPage } from './smart-ask-page'
import { getSmartAskConfig } from '../queries/get-smart-ask-config'
import { getSmartAskAnalytics } from '../queries/get-smart-ask-analytics'
import { Loader2 } from 'lucide-react'

/**
 * Wrapper component that handles data loading for SmartAskPage
 */
export function SmartAskPageWrapper() {
  const [config, setConfig] = useState(null)
  const [analytics, setAnalytics] = useState({
    totalSuggestions: 0,
    totalConversions: 0,
    conversionRate: 0,
    averageUplift: 0,
    recentSuggestions: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [configResult, analyticsResult] = await Promise.all([
          getSmartAskConfig(),
          getSmartAskAnalytics(),
        ])
        setConfig(configResult)
        setAnalytics(analyticsResult)
      } catch (error) {
        console.error('Error loading Smart Ask data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-neutral-500">Loading Smart Ask configuration...</p>
        </div>
      </div>
    )
  }

  return <SmartAskPage initialConfig={config} analytics={analytics} />
}
