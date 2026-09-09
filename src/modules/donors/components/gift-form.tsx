'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { recordGift } from '../actions/record-gift'
import type { CreateGiftInput } from '../schemas/gift.schema'
import { TributeSection, type TributeData } from './tribute-section'
import {
  CalendarIcon,
  DollarSign,
  User,
  Gift,
  CreditCard,
  FileText,
  Megaphone,
  Search,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Heart,
} from 'lucide-react'

interface GiftFormProps {
  contacts?: Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
  }>
  defaultContactId?: string
}

/**
 * Form component for recording gifts with improved UI/UX
 */
export function GiftForm({ contacts = [], defaultContactId }: GiftFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [donorSearchOpen, setDonorSearchOpen] = useState(false)
  const [donorSearchQuery, setDonorSearchQuery] = useState('')

  const [formData, setFormData] = useState<Partial<CreateGiftInput>>({
    contact_id: defaultContactId || '',
    amount: 0,
    gift_date: new Date().toISOString().split('T')[0],
    gift_type: 'one-time',
    campaign: '',
    payment_method: '',
    notes: '',
  })

  // Tribute state
  const [tribute, setTribute] = useState<TributeData>({
    isEnabled: false,
    type: 'honor',
    name: '',
    notifyEnabled: false,
    notifyName: '',
    notifyEmail: '',
    message: '',
  })
  const [tributeErrors, setTributeErrors] = useState<Record<string, string>>({})

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!donorSearchQuery.trim()) return contacts
    const query = donorSearchQuery.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.first_name.toLowerCase().includes(query) ||
        contact.last_name.toLowerCase().includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query))
    )
  }, [contacts, donorSearchQuery])

  // Get selected contact details
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === formData.contact_id),
    [contacts, formData.contact_id]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTributeErrors({})
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.contact_id) {
        throw new Error('Please select a donor')
      }
      if (!formData.amount || formData.amount <= 0) {
        throw new Error('Please enter a valid amount')
      }
      if (!formData.gift_date) {
        throw new Error('Please select a gift date')
      }
      if (!formData.gift_type) {
        throw new Error('Please select a gift type')
      }

      // Validate tribute fields
      if (tribute.isEnabled) {
        const errors: Record<string, string> = {}
        if (!tribute.name.trim()) {
          errors.tributeName = 'Please enter the honoree name'
        }
        if (tribute.notifyEnabled) {
          if (!tribute.notifyName.trim()) {
            errors.notifyName = 'Recipient name is required'
          }
          if (!tribute.notifyEmail.trim()) {
            errors.notifyEmail = 'Recipient email is required'
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tribute.notifyEmail)) {
            errors.notifyEmail = 'Please enter a valid email'
          }
        }
        if (Object.keys(errors).length > 0) {
          setTributeErrors(errors)
          setIsSubmitting(false)
          return
        }
      }

      // Build gift data with tribute fields
      const giftData: CreateGiftInput = {
        ...(formData as CreateGiftInput),
        ...(tribute.isEnabled && {
          tribute_type: tribute.type,
          tribute_name: tribute.name,
          tribute_notify_email: tribute.notifyEnabled ? tribute.notifyEmail : undefined,
          tribute_notify_name: tribute.notifyEnabled ? tribute.notifyName : undefined,
          tribute_message: tribute.notifyEnabled ? tribute.message : undefined,
        }),
      }

      const result = await recordGift(giftData)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Success - redirect to donor page
      router.push(`/donors/${formData.contact_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record gift')
      setIsSubmitting(false)
    }
  }

  const updateField = <K extends keyof CreateGiftInput>(
    field: K,
    value: CreateGiftInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-800">
              Unable to record gift
            </p>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Primary Section: Donor & Amount */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-primary-50 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary-600" />
              Gift Details
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Enter the essential information about this gift
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Donor Selector - Enhanced with search and avatars */}
            <div className="space-y-2">
              <Label
                htmlFor="contact_id"
                className="flex items-center gap-2 text-neutral-700"
              >
                <User className="h-4 w-4 text-neutral-400" />
                Donor
                <span className="text-rose-500">*</span>
              </Label>

              {contacts.length > 0 ? (
                <Popover open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={donorSearchOpen}
                      className={cn(
                        'flex h-12 w-full items-center justify-between rounded-lg border bg-white px-4 py-2 text-left transition-all',
                        'hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        donorSearchOpen
                          ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2'
                          : 'border-neutral-200',
                        !selectedContact && 'text-neutral-500'
                      )}
                    >
                      {selectedContact ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                              {getInitials(
                                selectedContact.first_name,
                                selectedContact.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-900">
                              {selectedContact.first_name}{' '}
                              {selectedContact.last_name}
                            </span>
                            {selectedContact.email && (
                              <span className="text-xs text-neutral-500">
                                {selectedContact.email}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm">Select a donor...</span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <div className="p-2 border-b border-neutral-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search donors..."
                          value={donorSearchQuery}
                          onChange={(e) => setDonorSearchQuery(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredContacts.length === 0 ? (
                        <div className="py-6 text-center text-sm text-neutral-500">
                          No donors found
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => {
                              updateField('contact_id', contact.id)
                              setDonorSearchOpen(false)
                              setDonorSearchQuery('')
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                              'hover:bg-neutral-50',
                              contact.id === formData.contact_id &&
                                'bg-primary-50'
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={cn(
                                  'text-xs',
                                  contact.id === formData.contact_id
                                    ? 'bg-primary-200 text-primary-800'
                                    : 'bg-neutral-100 text-neutral-600'
                                )}
                              >
                                {getInitials(
                                  contact.first_name,
                                  contact.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {contact.first_name} {contact.last_name}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-neutral-500 truncate">
                                  {contact.email}
                                </p>
                              )}
                            </div>
                            {contact.id === formData.contact_id && (
                              <Check className="h-4 w-4 text-primary-600 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex items-center gap-2 h-12 px-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  <span className="text-sm text-neutral-500">
                    Loading donors...
                  </span>
                </div>
              )}
            </div>

            {/* Amount Field - Prominent styling */}
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="flex items-center gap-2 text-neutral-700"
              >
                <DollarSign className="h-4 w-4 text-neutral-400" />
                Gift Amount
                <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <DollarSign className="h-4 w-4 text-green-700" />
                </div>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="h-14 pl-16 pr-4 text-2xl font-semibold text-neutral-900 border-neutral-200 focus-visible:ring-primary-500"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    updateField('amount', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <p className="text-xs text-neutral-500">
                Enter the total gift amount in dollars
              </p>
            </div>

            {/* Date and Gift Type - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gift Date with Calendar Picker */}
              <div className="space-y-2">
                <Label
                  htmlFor="gift_date"
                  className="flex items-center gap-2 text-neutral-700"
                >
                  <CalendarIcon className="h-4 w-4 text-neutral-400" />
                  Gift Date
                  <span className="text-rose-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex h-10 w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm transition-all',
                        'hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                      )}
                    >
                      <span className="text-neutral-900">
                        {formData.gift_date
                          ? format(new Date(formData.gift_date + 'T00:00:00'), 'MMMM d, yyyy')
                          : 'Select date'}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-neutral-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        formData.gift_date
                          ? new Date(formData.gift_date + 'T00:00:00')
                          : undefined
                      }
                      onSelect={(date) =>
                        updateField(
                          'gift_date',
                          date ? format(date, 'yyyy-MM-dd') : ''
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Gift Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="gift_type"
                  className="flex items-center gap-2 text-neutral-700"
                >
                  <Gift className="h-4 w-4 text-neutral-400" />
                  Gift Type
                  <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.gift_type}
                  onValueChange={(value) =>
                    updateField('gift_type', value as CreateGiftInput['gift_type'])
                  }
                >
                  <SelectTrigger
                    id="gift_type"
                    className="h-10 border-neutral-200 focus:ring-primary-500"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        One-time Gift
                      </div>
                    </SelectItem>
                    <SelectItem value="recurring">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        Recurring Gift
                      </div>
                    </SelectItem>
                    <SelectItem value="pledge">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Pledge
                      </div>
                    </SelectItem>
                    <SelectItem value="in-kind">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        In-kind Gift
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Section: Optional Details */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              Additional Details
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Optional information to help track this gift
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Campaign and Payment Method - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campaign */}
              <div className="space-y-2">
                <Label
                  htmlFor="campaign"
                  className="flex items-center gap-2 text-neutral-700"
                >
                  <Megaphone className="h-4 w-4 text-neutral-400" />
                  Campaign
                  <span className="text-xs text-neutral-400 font-normal ml-1">
                    Optional
                  </span>
                </Label>
                <Input
                  id="campaign"
                  type="text"
                  placeholder="e.g., Annual Fund 2024"
                  className="h-10 border-neutral-200 focus-visible:ring-primary-500"
                  value={formData.campaign || ''}
                  onChange={(e) => updateField('campaign', e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label
                  htmlFor="payment_method"
                  className="flex items-center gap-2 text-neutral-700"
                >
                  <CreditCard className="h-4 w-4 text-neutral-400" />
                  Payment Method
                  <span className="text-xs text-neutral-400 font-normal ml-1">
                    Optional
                  </span>
                </Label>
                <Select
                  value={formData.payment_method || ''}
                  onValueChange={(value) => updateField('payment_method', value)}
                >
                  <SelectTrigger
                    id="payment_method"
                    className="h-10 border-neutral-200 focus-visible:ring-primary-500"
                  >
                    <SelectValue placeholder="Select method..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="flex items-center gap-2 text-neutral-700"
              >
                <FileText className="h-4 w-4 text-neutral-400" />
                Notes
                <span className="text-xs text-neutral-400 font-normal ml-1">
                  Optional
                </span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this gift, such as donor preferences or special circumstances..."
                rows={3}
                className="border-neutral-200 focus-visible:ring-primary-500 resize-none"
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tribute Section */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Tribute Gift
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Make this gift in honor or memory of someone special
            </p>
          </div>
          <div className="p-6">
            <TributeSection
              value={tribute}
              onChange={setTribute}
              errors={tributeErrors}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[160px] bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Record Gift
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
