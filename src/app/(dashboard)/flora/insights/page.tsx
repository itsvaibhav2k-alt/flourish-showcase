import { Suspense } from 'react'
import { AIInsightsPage } from '@/modules/ai-insights'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI Insights | Flora',
  description: 'AI-powered analytics and recommendations',
}

export default function FloraInsightsPage() {
  return (
    <Suspense fallback={<InsightsLoading />}>
      <AIInsightsPage />
    </Suspense>
  )
}

function InsightsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
