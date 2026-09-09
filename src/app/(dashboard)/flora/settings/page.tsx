import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth/organization'
import { getAISettings } from '@/modules/settings/queries/get-ai-settings'
import { getAIUsageStats } from '@/modules/settings/queries/get-ai-usage-stats'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { FloraSettingsSection } from '../flora-settings-section'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI Settings | Flora',
  description: 'Configure AI features and voice profiles',
}

export default async function FloraSettingsPage() {
  const userRole = await getCurrentUserRole()

  if (userRole !== 'admin') {
    redirect('/flora')
  }

  const [aiSettings, usageStats] = await Promise.all([
    getAISettings().catch(() => null),
    getAIUsageStats().catch(() => null),
  ])

  if (!aiSettings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load AI settings</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<SettingsLoading />}>
      <div className="space-y-6">
        <FloraBreadcrumb currentPage="Settings" />

        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Settings</h2>
          <p className="text-gray-500 mt-1">
            Configure Flora&apos;s AI capabilities and monitor usage
          </p>
        </div>

        <FloraSettingsSection
          initialSettings={aiSettings}
          usageStats={usageStats || {
            totalCost: 0,
            emailCount: 0,
            tokenCount: 0,
            breakdown: { thankYou: 0, reengagement: 0, volunteer: 0 }
          }}
        />
      </div>
    </Suspense>
  )
}

function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
