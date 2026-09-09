import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layouts/page-header'
import { getCurrentUserRole } from '@/lib/auth/organization'
import { AccessRestricted } from '../access-restricted'
import { getAISettings } from '@/modules/settings/queries/get-ai-settings'
import { getAIUsageStats } from '@/modules/settings/queries/get-ai-usage-stats'
import { AISettingsContent } from './ai-settings-content'

export const dynamic = 'force-dynamic'

export default async function AISettingsPage() {
  // Check user role first - settings are admin-only
  const userRole = await getCurrentUserRole()

  // If user is not an admin, show access restricted page
  if (userRole !== 'admin') {
    return <AccessRestricted userRole={userRole} />
  }

  // Fetch AI settings and usage stats
  let aiSettings = null
  let usageStats = null
  let error: string | null = null

  try {
    aiSettings = await getAISettings()
  } catch (err) {
    console.error('Error fetching AI settings:', err)
    error = err instanceof Error ? err.message : 'Failed to load AI settings'
  }

  try {
    usageStats = await getAIUsageStats()
  } catch (err) {
    console.error('Error fetching usage stats:', err)
    // Don't fail the whole page if usage stats fail
  }

  // Error state
  if (error || !aiSettings) {
    return (
      <div className="min-h-screen bg-neutral-50/50 p-6">
        <PageHeader
          title="AI Settings"
          description="Configure Flora's AI-powered features for your organization"
        />
        <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-800">Unable to load AI settings. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6">
      <PageHeader
        title="AI Settings"
        description="Configure Flora's AI-powered features for your organization"
        action={
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl border border-primary-200 shadow-sm">
            <Image
              src="/flora-waving.png"
              alt="Flora mascot"
              width={48}
              height={72}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary-700">Meet Flora</span>
              <span className="text-xs text-primary-500 flex items-center gap-1">
                Your AI assistant <Sparkles className="h-3 w-3" />
              </span>
            </div>
          </div>
        }
      />

      <div className="mt-6">
        <AISettingsContent
          initialSettings={aiSettings}
          usageStats={usageStats || {
            totalCost: 0,
            emailCount: 0,
            tokenCount: 0,
            breakdown: { thankYou: 0, reengagement: 0, volunteer: 0 }
          }}
        />
      </div>
    </div>
  )
}
