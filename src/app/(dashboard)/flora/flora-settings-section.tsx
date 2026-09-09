'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, ChevronDown, ChevronUp, Sparkles, Mail, Bell, Users, Lightbulb, CheckCircle2, Phone, ArrowRight } from 'lucide-react'
import { AIFeatureToggleCard } from '@/modules/settings/components/ai-feature-toggle-card'
import { VoiceStatusCard } from '@/modules/settings/components/voice-status-card'
import { AICostDisplay } from '@/modules/settings/components/ai-cost-display'
import { updateAISetting, type AISettingKey } from '@/modules/settings/actions/update-ai-settings'
import { floraTooltips } from '@/lib/ai/flora-tooltips'
import type { AISettings } from '@/modules/settings/queries/get-ai-settings'
import type { AIUsageStats } from '@/modules/settings/queries/get-ai-usage-stats'

interface FloraSettingsSectionProps {
  initialSettings: AISettings
  usageStats: AIUsageStats
}

export function FloraSettingsSection({ initialSettings, usageStats }: FloraSettingsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [settings, setSettings] = React.useState(initialSettings)
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleToggle = async (key: AISettingKey, newValue: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: newValue }))
    setLoadingStates((prev) => ({ ...prev, [key]: true }))
    setErrorMessage(null)

    try {
      const result = await updateAISetting(key, newValue)

      if (result.success) {
        setSuccessMessage('Setting updated')
        setTimeout(() => setSuccessMessage(null), 2000)
      } else {
        setSettings((prev) => ({ ...prev, [key]: !newValue }))
        setErrorMessage(result.error || 'Failed to update')
        setTimeout(() => setErrorMessage(null), 4000)
      }
    } catch (error) {
      setSettings((prev) => ({ ...prev, [key]: !newValue }))
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <Card className="shadow-card border-neutral-200/60 bg-white">
      <CardHeader className="pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Flora Settings
              </CardTitle>
              <p className="text-sm text-neutral-500 mt-0.5">
                Configure AI features and preferences
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-600"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <CardContent className="p-5 space-y-5">
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
            example="When Sarah donates $100, Flora generates a personalized thank-you email referencing her giving history."
            enabled={settings.aiEmailGeneration}
            onToggle={(value) => handleToggle('aiEmailGeneration', value)}
            isLoading={loadingStates.aiEmailGeneration}
            floraTooltip={floraTooltips.aiEmailGeneration}
            icon={Sparkles}
            iconBgClass="bg-primary-50"
            badge={settings.aiEmailGeneration
              ? { text: 'Enabled', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />

          {/* Email Type Toggles */}
          {settings.aiEmailGeneration && (
            <div className="space-y-4 pl-4 border-l-2 border-primary-100">
              <p className="text-sm font-medium text-neutral-600">Email Types</p>

              <AIFeatureToggleCard
                id="auto-thank-you"
                title="Thank-You Emails"
                description={settings.autoThankYouEmails
                  ? "Auto-send when gifts are recorded"
                  : "Go to Review Queue for approval"}
                enabled={settings.autoThankYouEmails}
                onToggle={(value) => handleToggle('autoThankYouEmails', value)}
                isLoading={loadingStates.autoThankYouEmails}
                floraTooltip={floraTooltips.thankYouEmails}
                icon={Mail}
                iconBgClass="bg-primary-50"
                badge={settings.autoThankYouEmails
                  ? { text: 'Auto-Send', variant: 'success' as const }
                  : { text: 'Review', variant: 'warning' as const }
                }
              />

              <AIFeatureToggleCard
                id="auto-volunteer-confirmations"
                title="Volunteer Confirmations"
                description={settings.autoVolunteerConfirmations
                  ? "Auto-send when volunteers sign up"
                  : "No confirmation emails"}
                enabled={settings.autoVolunteerConfirmations}
                onToggle={(value) => handleToggle('autoVolunteerConfirmations', value)}
                isLoading={loadingStates.autoVolunteerConfirmations}
                floraTooltip={floraTooltips.volunteerEmails}
                icon={Users}
                iconBgClass="bg-primary-50"
                badge={settings.autoVolunteerConfirmations
                  ? { text: 'Auto-Send', variant: 'success' as const }
                  : { text: 'Disabled', variant: 'muted' as const }
                }
              />

              <AIFeatureToggleCard
                id="auto-volunteer-reminders"
                title="Volunteer Reminders"
                description={settings.autoVolunteerReminders
                  ? "Auto-send before shifts"
                  : "No reminder emails"}
                enabled={settings.autoVolunteerReminders}
                onToggle={(value) => handleToggle('autoVolunteerReminders', value)}
                isLoading={loadingStates.autoVolunteerReminders}
                floraTooltip={floraTooltips.volunteerEmails}
                icon={Bell}
                iconBgClass="bg-primary-50"
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
            title="Smart Suggestions"
            description="AI recommendations for the best next action with each contact"
            example="Based on John's history, Flora suggests a personalized call."
            enabled={settings.aiNextStepSuggestions}
            onToggle={(value) => handleToggle('aiNextStepSuggestions', value)}
            isLoading={loadingStates.aiNextStepSuggestions}
            floraTooltip={floraTooltips.nextStepSuggestions}
            icon={Lightbulb}
            iconBgClass="bg-primary-50"
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
        </CardContent>
      </div>
    </Card>
  )
}
