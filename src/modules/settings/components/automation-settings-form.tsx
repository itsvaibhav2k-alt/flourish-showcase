'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { updateAutomationSetting } from '../actions/update-automation-settings'
import type { AutomationSettings } from '../queries/get-automation-settings'
import { Sparkles, Mail, Bell, CheckCircle2, Clock } from 'lucide-react'

interface AutomationSettingsFormProps {
  initialSettings: AutomationSettings
}

export function AutomationSettingsForm({ initialSettings }: AutomationSettingsFormProps) {
  const [settings, setSettings] = React.useState<AutomationSettings>(initialSettings)
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleToggle = async (key: keyof AutomationSettings, newValue: boolean) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: newValue }))
    setLoadingStates((prev) => ({ ...prev, [key]: true }))
    setErrorMessage(null)

    try {
      const result = await updateAutomationSetting(key, newValue)

      if (result.success) {
        // Show success feedback
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

  const handleReminderHoursChange = async (newValue: number) => {
    // Validate range
    if (newValue < 1 || newValue > 168) {
      setErrorMessage('Hours must be between 1 and 168')
      setTimeout(() => setErrorMessage(null), 3000)
      return
    }

    // Optimistic update
    setSettings((prev) => ({ ...prev, reminderHoursBefore: newValue }))
    setLoadingStates((prev) => ({ ...prev, reminderHoursBefore: true }))
    setErrorMessage(null)

    try {
      const result = await updateAutomationSetting('reminderHoursBefore', newValue)

      if (result.success) {
        setSuccessMessage('Reminder timing updated successfully')
        setTimeout(() => setSuccessMessage(null), 2000)
      } else {
        // Revert on error
        setSettings((prev) => ({ ...prev, reminderHoursBefore: initialSettings.reminderHoursBefore }))
        setErrorMessage(result.error || 'Failed to update reminder hours')
        setTimeout(() => setErrorMessage(null), 4000)
      }
    } catch (error) {
      // Revert on error
      setSettings((prev) => ({ ...prev, reminderHoursBefore: initialSettings.reminderHoursBefore }))
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
      setTimeout(() => setErrorMessage(null), 4000)
    } finally {
      setLoadingStates((prev) => ({ ...prev, reminderHoursBefore: false }))
    }
  }

  return (
    <div className="space-y-4">
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

      {/* AI Email Generation */}
      <Card className="shadow-card border-neutral-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold tracking-tight">AI Email Generation</CardTitle>
              <CardDescription className="text-neutral-500">
                Use Claude AI to generate personalized email content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <Label htmlFor="ai-generation" className="text-sm font-medium text-neutral-900">
                Enable AI-Powered Emails
              </Label>
              <p className="text-sm text-neutral-600 mt-1">
                Generate personalized thank-you emails and communications using AI
              </p>
            </div>
            <Switch
              id="ai-generation"
              checked={settings.aiEmailGeneration}
              onCheckedChange={(checked) => handleToggle('aiEmailGeneration', checked)}
              disabled={loadingStates.aiEmailGeneration}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Automation Settings */}
      <Card className="shadow-card border-neutral-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold tracking-tight">Email Automation</CardTitle>
              <CardDescription className="text-neutral-500">
                Control which emails are sent automatically vs require review
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thank You Emails */}
          <div className="flex items-start justify-between pb-6 border-b border-neutral-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="auto-thank-you" className="text-sm font-medium text-neutral-900">
                  Auto-Send Thank You Emails
                </Label>
                {settings.autoThankYouEmails ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Auto-Send
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    Requires Review
                  </Badge>
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                {settings.autoThankYouEmails
                  ? 'AI-generated thank-you emails are sent immediately after gifts are recorded.'
                  : 'AI-generated thank-you emails go to the Review Queue for your approval before sending.'}
              </p>
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <p className="text-xs font-medium text-neutral-700 mb-1">Example:</p>
                <p className="text-xs text-neutral-600">
                  When Sarah donates $100, Claude generates a personalized thank-you email using your organization's voice.
                  {settings.autoThankYouEmails
                    ? ' The email is sent automatically within minutes.'
                    : ' The draft appears in Communications for you to review and approve.'}
                </p>
              </div>
            </div>
            <Switch
              id="auto-thank-you"
              checked={settings.autoThankYouEmails}
              onCheckedChange={(checked) => handleToggle('autoThankYouEmails', checked)}
              disabled={loadingStates.autoThankYouEmails}
              className="ml-4 flex-shrink-0"
            />
          </div>

          {/* Volunteer Confirmations */}
          <div className="flex items-start justify-between pb-6 border-b border-neutral-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="auto-confirmations" className="text-sm font-medium text-neutral-900">
                  Auto-Send Volunteer Confirmations
                </Label>
                {settings.autoVolunteerConfirmations ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Auto-Send
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                {settings.autoVolunteerConfirmations
                  ? 'Confirmation emails are sent immediately when volunteers sign up for shifts.'
                  : 'No confirmation emails are sent when volunteers sign up.'}
              </p>
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <p className="text-xs font-medium text-neutral-700 mb-1">Example:</p>
                <p className="text-xs text-neutral-600">
                  When John signs up for the "Food Bank Sorting" shift on Saturday,
                  {settings.autoVolunteerConfirmations
                    ? ' he receives an automatic confirmation email with shift details.'
                    : ' no email is sent (you can manually notify him if needed).'}
                </p>
              </div>
            </div>
            <Switch
              id="auto-confirmations"
              checked={settings.autoVolunteerConfirmations}
              onCheckedChange={(checked) => handleToggle('autoVolunteerConfirmations', checked)}
              disabled={loadingStates.autoVolunteerConfirmations}
              className="ml-4 flex-shrink-0"
            />
          </div>

          {/* Volunteer Reminders */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="auto-reminders" className="text-sm font-medium text-neutral-900">
                  Auto-Send Volunteer Reminders
                </Label>
                {settings.autoVolunteerReminders ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    Auto-Send
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                {settings.autoVolunteerReminders
                  ? 'Reminder emails are sent automatically before volunteer shifts.'
                  : 'No reminder emails are sent before volunteer shifts.'}
              </p>
              <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <p className="text-xs font-medium text-neutral-700 mb-1">Example:</p>
                <p className="text-xs text-neutral-600">
                  If reminders are set for 24 hours before shifts,
                  {settings.autoVolunteerReminders
                    ? ' volunteers receive an automatic reminder email 24 hours before their shift.'
                    : ' no reminder emails are sent (you can manually remind volunteers if needed).'}
                </p>
              </div>
            </div>
            <Switch
              id="auto-reminders"
              checked={settings.autoVolunteerReminders}
              onCheckedChange={(checked) => handleToggle('autoVolunteerReminders', checked)}
              disabled={loadingStates.autoVolunteerReminders}
              className="ml-4 flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Timing */}
      <Card className="shadow-card border-neutral-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold tracking-tight">Reminder Timing</CardTitle>
              <CardDescription className="text-neutral-500">
                Configure when to send volunteer shift reminders
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="reminder-hours" className="text-sm font-medium text-neutral-900">
              Hours Before Shift
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="reminder-hours"
                type="number"
                min={1}
                max={168}
                value={settings.reminderHoursBefore}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value)) {
                    handleReminderHoursChange(value)
                  }
                }}
                disabled={loadingStates.reminderHoursBefore}
                className="w-24"
              />
              <p className="text-sm text-neutral-600">
                hours before shift (1-168 hours / 1-7 days)
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              Reminders will be sent this many hours before a volunteer shift starts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary-50 border-primary-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary-900 mb-2">About Automation Settings</h4>
              <p className="text-sm text-primary-700 mb-3">
                Automation settings help balance efficiency with personal touch. Confirmations and reminders are
                typically sent automatically to save time, while personalized thank-you messages can require review to
                ensure they match your organization's voice and tone.
              </p>
              <div className="p-3 bg-white/60 rounded-md border border-primary-200">
                <p className="text-sm font-medium text-primary-900 mb-1">
                  AI Drafts & Review Queue
                </p>
                <p className="text-xs text-primary-700">
                  When AI email generation is enabled but auto-send is disabled, Claude generates personalized email drafts
                  and sends them to the Review Queue in Communications. You can preview, edit, and approve each draft before
                  it's sent, giving you full control over every message.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
