'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updateOrganization } from '../actions/update-organization'
import type { OrganizationSettings } from '../queries/get-organization'
import { Check, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrganizationFormProps {
  organization: OrganizationSettings
}

/*
 * Vercel/Notion-inspired settings card component
 * - Clean card with header, content, and footer
 * - Footer has hint text on left, action on right
 */
interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: {
    hint?: string
    action?: React.ReactNode
  }
  variant?: 'default' | 'danger'
}

function SettingsCard({ title, description, children, footer, variant = 'default' }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white overflow-hidden',
        variant === 'danger' ? 'border-red-200' : 'border-neutral-200'
      )}
    >
      {/* Header */}
      <div className="px-6 py-5">
        <h3
          className={cn(
            'text-sm font-semibold',
            variant === 'danger' ? 'text-red-900' : 'text-neutral-900'
          )}
        >
          {title}
        </h3>
        {description && (
          <p className={cn(
            'text-sm mt-1',
            variant === 'danger' ? 'text-red-600' : 'text-neutral-500'
          )}>
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-5">
        {children}
      </div>

      {/* Footer (Vercel-style) */}
      {footer && (
        <div
          className={cn(
            'border-t px-6 py-4 flex items-center justify-between',
            variant === 'danger'
              ? 'border-red-100 bg-red-50/50'
              : 'border-neutral-100 bg-neutral-50/50'
          )}
        >
          <p className={cn(
            'text-xs',
            variant === 'danger' ? 'text-red-600' : 'text-neutral-500'
          )}>
            {footer.hint}
          </p>
          {footer.action}
        </div>
      )}
    </div>
  )
}

/*
 * Linear-style horizontal form field
 * - Label on left, input on right
 */
interface FormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  horizontal?: boolean
}

function FormField({ label, hint, children, horizontal = true }: FormFieldProps) {
  if (horizontal) {
    return (
      <div className="flex items-start gap-8">
        <div className="w-48 flex-shrink-0 pt-2">
          <Label className="text-sm font-medium text-neutral-700">{label}</Label>
          {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-neutral-700">{label}</Label>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
      {children}
    </div>
  )
}

/*
 * Toggle row component (Notion-style)
 * - Label and description on left, switch on right
 */
interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleRow({ label, description, checked, onCheckedChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [name, setName] = React.useState(organization.name)
  const [publicSlug, setPublicSlug] = React.useState(organization.public_slug || '')

  // Feature toggles (stored in organization settings)
  const settings = (organization.settings || {}) as Record<string, boolean>
  const [allowPublicCalendar, setAllowPublicCalendar] = React.useState(settings.allowPublicCalendar ?? true)
  const [allowDonorPortal, setAllowDonorPortal] = React.useState(settings.allowDonorPortal ?? false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateOrganization({
        name,
        public_slug: publicSlug || null,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update organization')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      {/* General Settings Card */}
      <form onSubmit={handleSubmit}>
        <SettingsCard
          title="Organization Name"
          description="The name of your nonprofit organization as it appears throughout Flourish."
          footer={{
            hint: 'This is the display name for your organization.',
            action: (
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            ),
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your organization name"
            className="max-w-md"
            required
          />
        </SettingsCard>
      </form>

      {/* Public URL Card */}
      <SettingsCard
        title="Public URL Slug"
        description="Customize your organization's public-facing URL for embeddable widgets and donor pages."
        footer={{
          hint: 'Only lowercase letters, numbers, and hyphens allowed.',
          action: (
            <Button
              size="sm"
              onClick={async () => {
                setIsLoading(true)
                setError(null)
                try {
                  const result = await updateOrganization({
                    name,
                    public_slug: publicSlug || null,
                  })
                  if (result.success) {
                    setSuccess(true)
                    setTimeout(() => setSuccess(false), 3000)
                  } else {
                    setError(result.error || 'Failed to update')
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'An error occurred')
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          ),
        }}
      >
        <div className="flex items-center gap-0 max-w-lg">
          <span className="flex-shrink-0 text-sm text-neutral-500 bg-neutral-50 border border-r-0 border-neutral-200 rounded-l-md px-3 py-2">
            flourishnpo.com/embed/
          </span>
          <Input
            value={publicSlug}
            onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-organization"
            className="rounded-l-none"
          />
        </div>
      </SettingsCard>

      {/* Feature Toggles Card (Notion-style) */}
      <SettingsCard
        title="Public Features"
        description="Control which features are available publicly for your organization."
      >
        <div className="divide-y divide-neutral-100">
          <ToggleRow
            label="Public Volunteer Calendar"
            description="Allow visitors to view and sign up for volunteer shifts via embed."
            checked={allowPublicCalendar}
            onCheckedChange={setAllowPublicCalendar}
          />
          <ToggleRow
            label="Donor Portal"
            description="Enable a self-service portal for donors to view their giving history."
            checked={allowDonorPortal}
            onCheckedChange={setAllowDonorPortal}
          />
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <SettingsCard
        title="Danger Zone"
        description="Irreversible and destructive actions for your organization."
        variant="danger"
        footer={{
          hint: 'This action cannot be undone. All data will be permanently deleted.',
          action: (
            <Button variant="destructive" size="sm" disabled>
              Delete Organization
            </Button>
          ),
        }}
      >
        <p className="text-sm text-red-700">
          Deleting your organization will permanently remove all contacts, donors, volunteers,
          communications, and settings. This action is irreversible.
        </p>
      </SettingsCard>
    </div>
  )
}

export { SettingsCard, FormField, ToggleRow }
