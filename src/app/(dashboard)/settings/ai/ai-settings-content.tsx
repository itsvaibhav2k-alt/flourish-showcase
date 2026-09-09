'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sparkles, Mail, Bell, Users, Lightbulb, CheckCircle2, Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIFeatureToggleCard } from '@/modules/settings/components/ai-feature-toggle-card'
import { VoiceStatusCard } from '@/modules/settings/components/voice-status-card'
import { AICostDisplay } from '@/modules/settings/components/ai-cost-display'
import { updateAISetting, type AISettingKey } from '@/modules/settings/actions/update-ai-settings'
import { floraTooltips } from '@/lib/ai/flora-tooltips'
import type { AISettings } from '@/modules/settings/queries/get-ai-settings'
import type { AIUsageStats } from '@/modules/settings/queries/get-ai-usage-stats'

interface AISettingsContentProps {
  initialSettings: AISettings
  usageStats: AIUsageStats
}

export function AISettingsContent({ initialSettings, usageStats }: AISettingsContentProps) {
  const [settings, setSettings] = React.useState(initialSettings)
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleToggle = async (key: AISettingKey, newValue: boolean) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: newValue }))
    setLoadingStates((prev) => ({ ...prev, [key]: true }))
    setErrorMessage(null)

    try {
      const result = await updateAISetting(key, newValue)

      if (result.success) {
        setSuccessMessage('Setting updated successfully')
        setTimeout(() => setSuccessMessage(null), 2000)
      } else {
        // Revert on error
        setSettings((prev) => ({ ...prev, [key]: !newValue }))
        setErrorMessage(result.error || 'Failed to update setting')
        setTimeout(() => setErrorMessage(null), 4000)
      }
    } catch (error) {
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }))
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Master AI Toggle */}
      <AIFeatureToggleCard
        id="ai-email-generation"
        title="AI Email Generation"
        description="Use Claude AI to generate personalized email content for donors and volunteers"
        example="When Sarah donates $100, Claude generates a personalized thank-you email referencing her giving history and your organization's voice."
        enabled={settings.aiEmailGeneration}
        onToggle={(value) => handleToggle('aiEmailGeneration', value)}
        isLoading={loadingStates.aiEmailGeneration}
        floraTooltip={floraTooltips.aiEmailGeneration}
        icon={Sparkles}
        iconBgClass="from-primary-100 to-primary-200"
        badge={settings.aiEmailGeneration
          ? { text: 'Enabled', variant: 'success' as const }
          : { text: 'Disabled', variant: 'muted' as const }
        }
      />

      {/* Email Type Toggles - only show if AI is enabled */}
      {settings.aiEmailGeneration && (
        <div className="space-y-4 pl-4 border-l-2 border-primary-100">
          <p className="text-sm font-medium text-neutral-600">Email Types</p>

          <AIFeatureToggleCard
            id="auto-thank-you"
            title="Thank-You Emails"
            description={settings.autoThankYouEmails
              ? "AI-generated thank-you emails are sent automatically when gifts are recorded"
              : "AI-generated thank-you emails go to Review Queue for approval before sending"}
            enabled={settings.autoThankYouEmails}
            onToggle={(value) => handleToggle('autoThankYouEmails', value)}
            isLoading={loadingStates.autoThankYouEmails}
            floraTooltip={floraTooltips.thankYouEmails}
            icon={Mail}
            iconBgClass="from-rose-100 to-pink-100"
            badge={settings.autoThankYouEmails
              ? { text: 'Auto-Send', variant: 'success' as const }
              : { text: 'Requires Review', variant: 'warning' as const }
            }
          />

          <AIFeatureToggleCard
            id="auto-volunteer-confirmations"
            title="Volunteer Confirmations"
            description={settings.autoVolunteerConfirmations
              ? "Confirmation emails sent automatically when volunteers sign up for shifts"
              : "No confirmation emails sent when volunteers sign up"}
            enabled={settings.autoVolunteerConfirmations}
            onToggle={(value) => handleToggle('autoVolunteerConfirmations', value)}
            isLoading={loadingStates.autoVolunteerConfirmations}
            floraTooltip={floraTooltips.volunteerEmails}
            icon={Users}
            iconBgClass="from-teal-100 to-cyan-100"
            badge={settings.autoVolunteerConfirmations
              ? { text: 'Auto-Send', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />

          <AIFeatureToggleCard
            id="auto-volunteer-reminders"
            title="Volunteer Reminders"
            description={settings.autoVolunteerReminders
              ? "Reminder emails sent automatically before volunteer shifts"
              : "No reminder emails sent before volunteer shifts"}
            enabled={settings.autoVolunteerReminders}
            onToggle={(value) => handleToggle('autoVolunteerReminders', value)}
            isLoading={loadingStates.autoVolunteerReminders}
            floraTooltip={floraTooltips.volunteerEmails}
            icon={Bell}
            iconBgClass="from-amber-100 to-orange-100"
            badge={settings.autoVolunteerReminders
              ? { text: 'Auto-Send', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />
        </div>
      )}

      {/* Next Step Suggestions */}
      <AIFeatureToggleCard
        id="ai-next-step-suggestions"
        title="Next Step Suggestions"
        description="AI-powered recommendations for the best next action with each contact"
        example="Based on John's giving history and engagement, Flora suggests: 'Send a personalized thank-you call - he's been a consistent donor for 3 years.'"
        enabled={settings.aiNextStepSuggestions}
        onToggle={(value) => handleToggle('aiNextStepSuggestions', value)}
        isLoading={loadingStates.aiNextStepSuggestions}
        floraTooltip={floraTooltips.nextStepSuggestions}
        icon={Lightbulb}
        iconBgClass="from-yellow-100 to-amber-100"
        badge={settings.aiNextStepSuggestions
          ? { text: 'Enabled', variant: 'success' as const }
          : { text: 'Disabled', variant: 'muted' as const }
        }
      />

      {/* Voice Configuration Link */}
      <Link href="/flora/voice-config" className="block">
        <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Voice Configuration</p>
              <p className="text-xs text-neutral-500">Customize what Flora knows and says during calls</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400" />
        </div>
      </Link>

      {/* Voice Profile Status */}
      <VoiceStatusCard
        hasProfile={settings.voiceProfile.hasProfile}
        samplesCount={settings.voiceProfile.samplesCount}
        voiceSummary={settings.voiceProfile.voiceSummary}
        trainedAt={settings.voiceProfile.trainedAt}
        floraTooltip={floraTooltips.voiceProfile}
      />

      {/* Usage & Cost Display */}
      <AICostDisplay
        stats={usageStats}
        floraTooltip={floraTooltips.costTracking}
      />

      {/* Back to Settings */}
      <div className="flex justify-start pt-4">
        <Button variant="outline" asChild>
          <Link href="/settings">Back to Settings</Link>
        </Button>
      </div>
    </div>
  )
}
