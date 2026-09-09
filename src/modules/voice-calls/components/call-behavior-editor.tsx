'use client';

import * as React from 'react';
import { Plus, X, Phone, Heart, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AIFeatureToggleCard } from '@/modules/settings/components/ai-feature-toggle-card';
import { updateAISetting, type AISettingKey } from '@/modules/settings/actions/update-ai-settings';
import type { AISettings } from '@/modules/settings/queries/get-ai-settings';
import type { VoiceCallConfig } from '../queries/get-voice-config';

interface CallBehaviorEditorProps {
  config: VoiceCallConfig;
  onChange: (config: VoiceCallConfig) => void;
  onSave: () => void;
  isSaving: boolean;
  aiSettings: AISettings;
}

const PRESET_INFO_ITEMS = [
  { id: 'email_address', label: 'Email address' },
  { id: 'mailing_address', label: 'Mailing address' },
  { id: 'preferred_contact_method', label: 'Preferred contact method' },
  { id: 'interest_areas', label: 'Interest areas' },
  { id: 'event_attendance', label: 'Event attendance' },
  { id: 'birthday', label: 'Birthday' },
];

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

export function CallBehaviorEditor({
  config,
  onChange,
  onSave,
  isSaving,
  aiSettings,
}: CallBehaviorEditorProps) {
  const [localSettings, setLocalSettings] = React.useState({
    voiceCallsEnabled: aiSettings.voiceCallsEnabled,
    autoThankYouCalls: aiSettings.autoThankYouCalls,
    autoReengagementCalls: aiSettings.autoReengagementCalls,
    voiceShiftReminders: aiSettings.voiceShiftReminders,
  });
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  const [newCustomInfo, setNewCustomInfo] = React.useState('');
  const [newQuestion, setNewQuestion] = React.useState('');

  const updateCallBehavior = (
    field: keyof VoiceCallConfig['callBehavior'],
    value: string | string[],
  ) => {
    onChange({
      ...config,
      callBehavior: {
        ...config.callBehavior,
        [field]: value,
      },
    });
  };

  // Voice toggle handlers
  const handleToggle = async (key: AISettingKey, newValue: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: newValue }));
    setLoadingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await updateAISetting(key, newValue);
      if (!result.success) {
        setLocalSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    } catch {
      setLocalSettings((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Info to collect helpers
  const isPresetChecked = (id: string) => config.callBehavior.infoToCollect.includes(id);

  const togglePresetInfo = (id: string, checked: boolean) => {
    if (checked) {
      updateCallBehavior('infoToCollect', [...config.callBehavior.infoToCollect, id]);
    } else {
      updateCallBehavior(
        'infoToCollect',
        config.callBehavior.infoToCollect.filter((item) => item !== id),
      );
    }
  };

  const customInfoItems = config.callBehavior.infoToCollect.filter(
    (item) => !PRESET_INFO_ITEMS.some((preset) => preset.id === item),
  );

  const addCustomInfo = () => {
    const trimmed = newCustomInfo.trim();
    if (!trimmed) return;
    updateCallBehavior('infoToCollect', [...config.callBehavior.infoToCollect, trimmed]);
    setNewCustomInfo('');
  };

  const removeCustomInfo = (item: string) => {
    updateCallBehavior(
      'infoToCollect',
      config.callBehavior.infoToCollect.filter((i) => i !== item),
    );
  };

  // Custom questions helpers
  const addQuestion = () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    updateCallBehavior('customQuestions', [...config.callBehavior.customQuestions, trimmed]);
    setNewQuestion('');
  };

  const removeQuestion = (index: number) => {
    updateCallBehavior(
      'customQuestions',
      config.callBehavior.customQuestions.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Voice Call Toggles */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Voice Calls
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Control which voice calling features are enabled for your organization.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
            badge={
              localSettings.voiceCallsEnabled
                ? { text: 'Enabled', variant: 'success' as const }
                : { text: 'Disabled', variant: 'muted' as const }
            }
          />

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
                badge={
                  localSettings.autoThankYouCalls
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
                badge={
                  localSettings.autoReengagementCalls
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
                badge={
                  localSettings.voiceShiftReminders
                    ? { text: 'Auto-Call', variant: 'success' as const }
                    : { text: 'Disabled', variant: 'muted' as const }
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Greeting Message */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Greeting Message
          </CardTitle>
          <p className="text-sm text-neutral-500">
            How Flora introduces herself at the start of each call.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.callBehavior.greeting}
            onChange={(e) => updateCallBehavior('greeting', e.target.value)}
            placeholder="Hi there! This is Flora from [your org]..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Information to Collect */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Information to Collect
          </CardTitle>
          <p className="text-sm text-neutral-500">
            What information should Flora try to gather during calls when appropriate.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PRESET_INFO_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={`info-${item.id}`}
                  checked={isPresetChecked(item.id)}
                  onCheckedChange={(checked) =>
                    togglePresetInfo(item.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`info-${item.id}`}
                  className="text-sm text-neutral-700 cursor-pointer"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>

          {customInfoItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Custom Items
              </p>
              {customInfoItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                    {item}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomInfo(item)}
                    className="h-8 w-8 text-neutral-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={newCustomInfo}
              onChange={(e) => setNewCustomInfo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomInfo();
                }
              }}
              placeholder="Add custom information to collect..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addCustomInfo}
              disabled={!newCustomInfo.trim()}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Questions */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Custom Questions
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Add questions Flora should ask during calls when the conversation allows.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.callBehavior.customQuestions.map((question, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                {question}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(index)}
                className="h-9 w-9 text-neutral-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addQuestion();
                }
              }}
              placeholder="e.g., How did you first hear about us?"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addQuestion}
              disabled={!newQuestion.trim()}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Closing Guidance */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Closing Guidance
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Instructions for how Flora should wrap up calls.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.callBehavior.closingGuidance}
            onChange={(e) => updateCallBehavior('closingGuidance', e.target.value)}
            placeholder="Any specific instructions for how Flora should end calls..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
