'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createDonationForm } from '../actions/create-donation-form'
import { updateDonationForm } from '../actions/update-donation-form'
import type { CreateDonationFormInput, DonationForm } from '../schemas/donation.schema'
import {
  Settings,
  DollarSign,
  Mail,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DonationFormBuilderProps {
  existingForm?: DonationForm
  onSuccess?: () => void
}

/**
 * Form builder component for creating/editing donation forms
 */
export function DonationFormBuilder({ existingForm, onSuccess }: DonationFormBuilderProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState<Partial<CreateDonationFormInput>>({
    name: existingForm?.name || '',
    slug: existingForm?.slug || '',
    title: existingForm?.title || '',
    description: existingForm?.description || '',
    preset_amounts: existingForm?.preset_amounts || [25, 50, 100, 250, 500],
    allow_custom_amount: existingForm?.allow_custom_amount ?? true,
    min_amount: existingForm?.min_amount || 1,
    max_amount: existingForm?.max_amount || null,
    allow_recurring: existingForm?.allow_recurring ?? true,
    default_frequency: existingForm?.default_frequency || 'one-time',
    campaign: existingForm?.campaign || '',
    collect_donor_info: existingForm?.collect_donor_info ?? true,
    require_email: existingForm?.require_email ?? true,
    require_phone: existingForm?.require_phone ?? false,
    require_address: existingForm?.require_address ?? false,
    thank_you_message: existingForm?.thank_you_message || '',
    redirect_url: existingForm?.redirect_url || '',
    is_active: existingForm?.is_active ?? true,
  })

  const [newAmount, setNewAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name) throw new Error('Form name is required')
      if (!formData.slug) throw new Error('Slug is required')
      if (!formData.title) throw new Error('Title is required')

      // Auto-generate slug from name if empty
      if (!existingForm && !formData.slug && formData.name) {
        formData.slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      const result = existingForm
        ? await updateDonationForm(existingForm.id, formData as CreateDonationFormInput)
        : await createDonationForm(formData as CreateDonationFormInput)

      if (!result.success) {
        throw new Error(result.error)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/donations/forms')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save donation form')
      setIsSubmitting(false)
    }
  }

  const updateField = <K extends keyof CreateDonationFormInput>(
    field: K,
    value: CreateDonationFormInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addPresetAmount = () => {
    const amount = parseFloat(newAmount)
    if (!isNaN(amount) && amount > 0) {
      const amounts = [...(formData.preset_amounts || [])]
      if (!amounts.includes(amount)) {
        amounts.push(amount)
        amounts.sort((a, b) => a - b)
        updateField('preset_amounts', amounts)
      }
      setNewAmount('')
    }
  }

  const removePresetAmount = (amount: number) => {
    const amounts = (formData.preset_amounts || []).filter((a) => a !== amount)
    updateField('preset_amounts', amounts)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-800">Error saving form</p>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary-600" />
              Basic Information
            </CardTitle>
            <CardDescription>Set up the basic details for your donation form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Form Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., General Donation Form"
                  required
                />
                <p className="text-xs text-neutral-500">Internal name for your reference</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="e.g., general-donation"
                  required
                />
                <p className="text-xs text-neutral-500">URL-friendly identifier</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Public Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Support Our Mission"
                required
              />
              <p className="text-xs text-neutral-500">Title shown to donors</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell donors about your cause and how their donation will help..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign (Optional)</Label>
              <Input
                id="campaign"
                value={formData.campaign || ''}
                onChange={(e) => updateField('campaign', e.target.value)}
                placeholder="e.g., Annual Fund 2024"
              />
            </div>
          </CardContent>
        </Card>

        {/* Donation Amounts */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              Donation Amounts
            </CardTitle>
            <CardDescription>Configure preset amounts and donation limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Preset Amounts</Label>
              <div className="flex flex-wrap gap-2">
                {(formData.preset_amounts || []).map((amount) => (
                  <div
                    key={amount}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-200"
                  >
                    <span className="text-sm font-medium">${amount}</span>
                    <button
                      type="button"
                      onClick={() => removePresetAmount(amount)}
                      className="hover:text-primary-900 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Add amount"
                  className="max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPresetAmount()
                    }
                  }}
                />
                <Button type="button" onClick={addPresetAmount} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_amount">Minimum Amount</Label>
                <Input
                  id="min_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.min_amount || 1}
                  onChange={(e) => updateField('min_amount', parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_amount">Maximum Amount (Optional)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.max_amount || ''}
                  onChange={(e) =>
                    updateField('max_amount', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="allow_custom_amount" className="font-medium">
                  Allow Custom Amounts
                </Label>
                <p className="text-xs text-neutral-500">
                  Let donors enter their own donation amount
                </p>
              </div>
              <Switch
                id="allow_custom_amount"
                checked={formData.allow_custom_amount}
                onCheckedChange={(checked) => updateField('allow_custom_amount', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recurring Donations */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary-600" />
              Recurring Donations
            </CardTitle>
            <CardDescription>Enable monthly or recurring donation options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="allow_recurring" className="font-medium">
                  Allow Recurring Donations
                </Label>
                <p className="text-xs text-neutral-500">
                  Let donors set up monthly or recurring gifts
                </p>
              </div>
              <Switch
                id="allow_recurring"
                checked={formData.allow_recurring}
                onCheckedChange={(checked) => updateField('allow_recurring', checked)}
              />
            </div>

            {formData.allow_recurring && (
              <div className="space-y-2">
                <Label htmlFor="default_frequency">Default Frequency</Label>
                <Select
                  value={formData.default_frequency}
                  onValueChange={(value: any) => updateField('default_frequency', value)}
                >
                  <SelectTrigger id="default_frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donor Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary-600" />
              Donor Information
            </CardTitle>
            <CardDescription>Configure what information to collect from donors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="require_email" className="font-medium">
                    Require Email
                  </Label>
                  <p className="text-xs text-neutral-500">Ask donors for their email address</p>
                </div>
                <Switch
                  id="require_email"
                  checked={formData.require_email}
                  onCheckedChange={(checked) => updateField('require_email', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="require_phone" className="font-medium">
                    Require Phone
                  </Label>
                  <p className="text-xs text-neutral-500">Ask donors for their phone number</p>
                </div>
                <Switch
                  id="require_phone"
                  checked={formData.require_phone}
                  onCheckedChange={(checked) => updateField('require_phone', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="require_address" className="font-medium">
                    Require Address
                  </Label>
                  <p className="text-xs text-neutral-500">Ask donors for their mailing address</p>
                </div>
                <Switch
                  id="require_address"
                  checked={formData.require_address}
                  onCheckedChange={(checked) => updateField('require_address', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thank You & Redirect */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5 text-primary-600" />
              After Donation
            </CardTitle>
            <CardDescription>Customize what happens after a successful donation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="thank_you_message">Thank You Message</Label>
              <Textarea
                id="thank_you_message"
                value={formData.thank_you_message || ''}
                onChange={(e) => updateField('thank_you_message', e.target.value)}
                placeholder="Thank you for your generous donation! Your support makes a difference."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect_url">Redirect URL (Optional)</Label>
              <Input
                id="redirect_url"
                type="url"
                value={formData.redirect_url || ''}
                onChange={(e) => updateField('redirect_url', e.target.value)}
                placeholder="https://example.com/thank-you"
              />
              <p className="text-xs text-neutral-500">
                Redirect donors to a custom page after donation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="font-medium">
                  Form Active
                </Label>
                <p className="text-sm text-neutral-500">
                  Make this form available to accept donations
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{existingForm ? 'Update Form' : 'Create Form'}</>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Preview Section */}
      {showPreview && (
        <Card className="border-primary-200 bg-primary-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>How your donation form will appear to donors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{formData.title || 'Donation Form Title'}</h2>
              {formData.description && (
                <p className="text-neutral-600 mb-6">{formData.description}</p>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(formData.preset_amounts || []).slice(0, 6).map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="px-4 py-3 border-2 border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-sm font-medium"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  {formData.allow_custom_amount && (
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      className="mt-2"
                      disabled
                    />
                  )}
                </div>

                {formData.allow_recurring && (
                  <div>
                    <Label className="mb-2 block">Frequency</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={formData.default_frequency} />
                      </SelectTrigger>
                    </Select>
                  </div>
                )}

                <div className="pt-2">
                  <Button disabled className="w-full">
                    Complete Donation
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
