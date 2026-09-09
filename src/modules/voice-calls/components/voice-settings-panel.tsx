'use client';

import * as React from 'react';
import { Phone, Heart, TrendingUp, Bell } from 'lucide-react';
import { AIFeatureToggleCard } from '@/modules/settings/components/ai-feature-toggle-card';
import { updateAISetting, type AISettingKey } from '@/modules/settings/actions/update-ai-settings';

interface VoiceSettings {
  voiceCallsEnabled: boolean;
  autoThankYouCalls: boolean;
  autoReengagementCalls: boolean;
  voiceShiftReminders: boolean;
}

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
}

const floraTooltips = {
  voiceCalls: {
    title: 'Voice Calling with Flora',
    content:
      "When enabled, I can place AI-powered phone calls to your contacts using natural conversation. I'll use your organization's voice profile to match your tone and style.",
    tip: 'This is the master switch for all voice calling features. Turning it off disables automated calls below.',
  },
  autoThankYouCalls: {
    title: 'Auto Thank-You Calls',
    content:
      "I'll automatically call donors after significant gifts to express gratitude. Each call is personalized with their giving history and relationship details.",
    tip: 'Calls are only placed during your configured calling hours. Set a gift threshold to control which donations trigger calls.',
  },
  autoReengagementCalls: {
    title: 'Auto Re-engagement Calls',
    content:
      "I'll reach out to lapsed donors with a friendly phone call to reconnect and understand their situation. This personal touch can be more effective than email alone.",
    tip: 'Only targets high-risk lapsed donors with significant lifetime giving. Pairs well with re-engagement emails.',
  },
  voiceShiftReminders: {
    title: 'Voice Shift Reminders',
    content:
      "I'll call volunteers with a brief reminder before their scheduled shifts. A personal call can help reduce no-shows.",
    tip: 'Calls are placed a few hours before the shift starts, after the email reminder has been sent.',
  },
};

export function VoiceSettingsPanel({ settings }: VoiceSettingsPanelProps) {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const handleToggle = async (key: AISettingKey, newValue: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: newValue }));
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await updateAISetting(key, newValue);
      if (!result.success) {
        // Revert on error
        setLocalSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    } catch {
      setLocalSettings((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">Voice Calling</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          AI-powered phone calls using Flora&apos;s voice
        </p>
      </div>

      {/* Master Voice Toggle */}
      <AIFeatureToggleCard
        id="voice-calls-enabled"
        title="Voice Calls"
        description="Enable AI-powered phone calls with Flora for personalized donor and volunteer outreach"
        example="When a major donor gives $500+, Flora can call to personally thank them within hours, referencing their specific gift and history."
        enabled={localSettings.voiceCallsEnabled}
        onToggle={(value) => handleToggle('voiceCallsEnabled', value)}
        isLoading={loadingStates.voiceCallsEnabled}
        floraTooltip={floraTooltips.voiceCalls}
        icon={Phone}
        iconBgClass="from-emerald-100 to-teal-100"
        badge={localSettings.voiceCallsEnabled
          ? { text: 'Enabled', variant: 'success' as const }
          : { text: 'Disabled', variant: 'muted' as const }
        }
      />

      {/* Sub-toggles - only show if voice calls enabled */}
      {localSettings.voiceCallsEnabled && (
        <div className="space-y-4 pl-4 border-l-2 border-primary-100">
          <p className="text-sm font-medium text-neutral-600">Automated Calls</p>

          <AIFeatureToggleCard
            id="auto-thank-you-calls"
            title="Auto Thank-You Calls"
            description="Automatically call donors after gifts above your configured threshold"
            enabled={localSettings.autoThankYouCalls}
            onToggle={(value) => handleToggle('autoThankYouCalls', value)}
            isLoading={loadingStates.autoThankYouCalls}
            floraTooltip={floraTooltips.autoThankYouCalls}
            icon={Heart}
            iconBgClass="from-rose-100 to-pink-100"
            badge={localSettings.autoThankYouCalls
              ? { text: 'Auto-Call', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />

          <AIFeatureToggleCard
            id="auto-reengagement-calls"
            title="Auto Re-engagement Calls"
            description="Automatically call high-risk lapsed donors to reconnect"
            enabled={localSettings.autoReengagementCalls}
            onToggle={(value) => handleToggle('autoReengagementCalls', value)}
            isLoading={loadingStates.autoReengagementCalls}
            floraTooltip={floraTooltips.autoReengagementCalls}
            icon={TrendingUp}
            iconBgClass="from-amber-100 to-orange-100"
            badge={localSettings.autoReengagementCalls
              ? { text: 'Auto-Call', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />

          <AIFeatureToggleCard
            id="voice-shift-reminders"
            title="Voice Shift Reminders"
            description="Call volunteers with a brief reminder before their scheduled shifts"
            enabled={localSettings.voiceShiftReminders}
            onToggle={(value) => handleToggle('voiceShiftReminders', value)}
            isLoading={loadingStates.voiceShiftReminders}
            floraTooltip={floraTooltips.voiceShiftReminders}
            icon={Bell}
            iconBgClass="from-violet-100 to-purple-100"
            badge={localSettings.voiceShiftReminders
              ? { text: 'Auto-Call', variant: 'success' as const }
              : { text: 'Disabled', variant: 'muted' as const }
            }
          />
        </div>
      )}
    </div>
  );
}
