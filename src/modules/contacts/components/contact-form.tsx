'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Heart,
  HandHelping,
  AlertCircle,
  Loader2,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { createContact } from '../actions/create-contact'
import { updateContact } from '../actions/update-contact'
import { checkDuplicates, type DuplicateMatch } from '../actions/check-duplicates'
import { DuplicateWarning } from './duplicate-warning'
import type { Contact, CreateContactInput } from '../schemas/contact.schema'

interface ContactFormProps {
  contact?: Contact
  mode: 'create' | 'edit'
}

// Reusable form field wrapper with icon support
function FormField({
  children,
  label,
  htmlFor,
  required = false,
  icon: Icon,
  hint
}: {
  children: React.ReactNode
  label: string
  htmlFor: string
  required?: boolean
  icon?: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-700 flex items-center gap-1.5"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-neutral-400" />}
        {label}
        {required && <span className="text-primary-500">*</span>}
      </Label>
      {children}
      {hint && (
        <p className="text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  )
}

// Section header component for visual consistency
function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-neutral-500">
            {description}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  )
}

export function ContactForm({ contact, mode }: ContactFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = React.useState(contact?.first_name || '')
  const [lastName, setLastName] = React.useState(contact?.last_name || '')
  const [email, setEmail] = React.useState(contact?.email || '')
  const [phone, setPhone] = React.useState(contact?.phone || '')
  const [street, setStreet] = React.useState(contact?.address?.street || '')
  const [city, setCity] = React.useState(contact?.address?.city || '')
  const [state, setState] = React.useState(contact?.address?.state || '')
  const [zip, setZip] = React.useState(contact?.address?.zip || '')
  const [tags, setTags] = React.useState(contact?.tags?.join(', ') || '')
  const [isDonor, setIsDonor] = React.useState(contact?.is_donor || false)
  const [isVolunteer, setIsVolunteer] = React.useState(contact?.is_volunteer || false)

  // Duplicate detection state
  const [duplicateMatches, setDuplicateMatches] = React.useState<DuplicateMatch[]>([])
  const [isCheckingDuplicates, setIsCheckingDuplicates] = React.useState(false)
  const [duplicatesDismissed, setDuplicatesDismissed] = React.useState(false)

  // Debounced duplicate check
  const checkDuplicatesDebounced = React.useCallback(
    async (checkEmail: string, checkFirstName: string, checkLastName: string, checkPhone: string) => {
      // Only check in create mode or if significant fields changed
      if (mode === 'edit') return

      // Need at least name or email to check
      if (!checkEmail && !(checkFirstName && checkLastName)) {
        setDuplicateMatches([])
        return
      }

      setIsCheckingDuplicates(true)
      setDuplicatesDismissed(false)

      try {
        const result = await checkDuplicates({
          email: checkEmail || undefined,
          first_name: checkFirstName,
          last_name: checkLastName,
          phone: checkPhone || undefined,
        })
        setDuplicateMatches(result.matches)
      } catch (err) {
        console.error('Error checking duplicates:', err)
      } finally {
        setIsCheckingDuplicates(false)
      }
    },
    [mode]
  )

  // Trigger duplicate check when relevant fields change
  React.useEffect(() => {
    if (mode === 'edit') return

    const timer = setTimeout(() => {
      checkDuplicatesDebounced(email, firstName, lastName, phone)
    }, 500)

    return () => clearTimeout(timer)
  }, [email, firstName, lastName, phone, checkDuplicatesDebounced, mode])

  const handleMergeIntoExisting = (contactId: string) => {
    router.push(`/contacts/${contactId}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Parse tags from comma-separated string
      const parsedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Build address object
      const address = street || city || state || zip
        ? { street, city, state, zip }
        : undefined

      const input: CreateContactInput = {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        address,
        tags: parsedTags,
        is_donor: isDonor,
        is_volunteer: isVolunteer,
      }

      if (mode === 'create') {
        const result = await createContact(input)
        if (result.success && result.data) {
          router.push(`/contacts/${result.data.id}`)
        } else {
          setError(result.error || 'Failed to create contact')
        }
      } else {
        const result = await updateContact(contact!.id, input)
        if (result.success) {
          router.push(`/contacts/${contact!.id}`)
        } else {
          setError(result.error || 'Failed to update contact')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-rose-800">
              There was a problem
            </p>
            <p className="text-sm text-rose-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Warning */}
      {mode === 'create' && duplicateMatches.length > 0 && !duplicatesDismissed && (
        <DuplicateWarning
          matches={duplicateMatches}
          onMerge={handleMergeIntoExisting}
          onDismiss={() => setDuplicatesDismissed(true)}
        />
      )}

      {/* Two Column Layout for larger screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          <Card className="overflow-hidden shadow-sm">
            <SectionHeader
              icon={User}
              title="Basic Information"
              description="Enter the contact's name and primary contact details"
            />
            <CardContent className="space-y-5 pt-0">
              {/* Name Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First Name" htmlFor="firstName" required>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    required
                    className="h-11"
                  />
                </FormField>
                <FormField label="Last Name" htmlFor="lastName" required>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    required
                    className="h-11"
                  />
                </FormField>
              </div>

              {/* Contact Details Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email Address" htmlFor="email" icon={Mail}>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11"
                  />
                </FormField>
                <FormField label="Phone Number" htmlFor="phone" icon={Phone}>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-11"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Section */}
          <Card className="overflow-hidden shadow-sm">
            <SectionHeader
              icon={Tag}
              title="Additional Information"
              description="Categorize and classify this contact"
            />
            <CardContent className="space-y-6 pt-0">
              <FormField
                label="Tags"
                htmlFor="tags"
                hint="Separate multiple tags with commas"
              >
                <Input
                  id="tags"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="Major Donor, Board Member, Corporate Partner"
                  className="h-11"
                />
              </FormField>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700">
                  Contact Roles
                </Label>
                <div className="grid gap-3">
                  {/* Donor Checkbox */}
                  <label
                    htmlFor="isDonor"
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors has-[:checked]:bg-primary-50 has-[:checked]:border-primary-200"
                  >
                    <Checkbox
                      id="isDonor"
                      checked={isDonor}
                      onCheckedChange={(checked) => setIsDonor(checked === true)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                        <Heart className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Donor</p>
                        <p className="text-xs text-neutral-500">Track donations and giving history</p>
                      </div>
                    </div>
                  </label>

                  {/* Volunteer Checkbox */}
                  <label
                    htmlFor="isVolunteer"
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors has-[:checked]:bg-primary-50 has-[:checked]:border-primary-200"
                  >
                    <Checkbox
                      id="isVolunteer"
                      checked={isVolunteer}
                      onCheckedChange={(checked) => setIsVolunteer(checked === true)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        <HandHelping className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Volunteer</p>
                        <p className="text-xs text-neutral-500">Manage shifts and availability</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Address Section */}
          <Card className="overflow-hidden shadow-sm">
            <SectionHeader
              icon={MapPin}
              title="Address"
              description="Optional mailing address for correspondence"
            />
            <CardContent className="space-y-5 pt-0">
              <FormField label="Street Address" htmlFor="street" icon={Building2}>
                <Input
                  id="street"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="123 Main Street, Apt 4"
                  className="h-11"
                />
              </FormField>

              <FormField label="City" htmlFor="city">
                <Input
                  id="city"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="h-11"
                />
              </FormField>

              <div className="grid gap-4 grid-cols-2">
                <FormField label="State" htmlFor="state">
                  <Input
                    id="state"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                    className="h-11 uppercase"
                  />
                </FormField>
                <FormField label="ZIP Code" htmlFor="zip">
                  <Input
                    id="zip"
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                    placeholder="94102"
                    className="h-11"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips Card */}
          <Card className="overflow-hidden shadow-sm bg-gradient-to-br from-primary-50 to-violet-50 border-primary-100">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-primary-900 mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-primary-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Mark contacts as <strong>Donor</strong> to track their giving history
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Mark contacts as <strong>Volunteer</strong> to manage shift signups
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  Use <strong>Tags</strong> to segment contacts for communications
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="min-w-[160px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Contact'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
