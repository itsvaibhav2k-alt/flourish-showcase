'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { TributeSection, type TributeData } from './tribute-section'

interface DonationFormProps {
  organizationId: string
  organizationName: string
  orgSlug: string
  formId: string
  formName: string
  suggestedAmounts: number[]
  defaultAmount?: number
  allowCustomAmount: boolean
  allowRecurring: boolean
  onSuccess?: () => void
}

export function DonationForm({
  organizationId,
  organizationName,
  orgSlug,
  formId,
  formName,
  suggestedAmounts,
  defaultAmount,
  allowCustomAmount,
  allowRecurring,
  onSuccess,
}: DonationFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  // Form state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    defaultAmount || (suggestedAmounts.length > 0 ? suggestedAmounts[0] : null)
  )
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  // Donor info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

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

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const amount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount || 0

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) errors.firstName = 'First name is required'
    if (!lastName.trim()) errors.lastName = 'Last name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (amount <= 0) {
      errors.amount = 'Please select or enter a donation amount'
    } else if (amount < 1) {
      errors.amount = 'Minimum donation is $1'
    }

    // Tribute validation
    if (tribute.isEnabled) {
      if (!tribute.name.trim()) {
        errors.tributeName = 'Please enter the name of the person'
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
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Build return URL with tribute data if applicable
      let returnUrl = `${window.location.origin}/donate/${orgSlug}/thank-you?amount=${amount}&email=${encodeURIComponent(email)}&recurring=${isRecurring}&orgName=${encodeURIComponent(organizationName)}`

      if (tribute.isEnabled) {
        returnUrl += `&tributeType=${tribute.type}&tributeName=${encodeURIComponent(tribute.name)}`
      }

      // Submit the payment to Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: email,
          payment_method_data: {
            billing_details: {
              name: `${firstName} ${lastName}`,
              email: email,
              phone: phone || undefined,
            },
          },
        },
      })

      if (error) {
        setErrorMessage(error.message || 'An error occurred processing your payment')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Donation Amount</Label>
          {allowRecurring && (
            <div className="flex items-center gap-2">
              <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">
                Monthly
              </Label>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
          )}
        </div>

        {/* Suggested amounts */}
        {suggestedAmounts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {suggestedAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedAmount(amt)
                  setIsCustom(false)
                  setFormErrors((prev) => ({ ...prev, amount: '' }))
                }}
                className={`
                  py-3 px-4 rounded-lg border-2 font-semibold transition-all
                  ${
                    !isCustom && selectedAmount === amt
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }
                `}
              >
                ${amt}
              </button>
            ))}
          </div>
        )}

        {/* Custom amount */}
        {allowCustomAmount && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsCustom(!isCustom)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isCustom ? 'Choose suggested amount' : 'Enter custom amount'}
            </button>
            {isCustom && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setFormErrors((prev) => ({ ...prev, amount: '' }))
                  }}
                  className="pl-7 text-lg font-semibold"
                />
              </div>
            )}
          </div>
        )}

        {formErrors.amount && (
          <p className="text-sm text-rose-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {formErrors.amount}
          </p>
        )}
      </div>

      {/* Donor information */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Your Information</Label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                setFormErrors((prev) => ({ ...prev, firstName: '' }))
              }}
              className={formErrors.firstName ? 'border-rose-500' : ''}
            />
            {formErrors.firstName && (
              <p className="text-sm text-rose-600">{formErrors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                setFormErrors((prev) => ({ ...prev, lastName: '' }))
              }}
              className={formErrors.lastName ? 'border-rose-500' : ''}
            />
            {formErrors.lastName && (
              <p className="text-sm text-rose-600">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-rose-600">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormErrors((prev) => ({ ...prev, email: '' }))
            }}
            className={formErrors.email ? 'border-rose-500' : ''}
          />
          {formErrors.email && (
            <p className="text-sm text-rose-600">{formErrors.email}</p>
          )}
          <p className="text-xs text-neutral-500">
            We'll send your receipt to this email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Tribute section */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Tribute Gift</Label>
        <TributeSection
          value={tribute}
          onChange={setTribute}
          errors={formErrors}
        />
      </div>

      {/* Payment element */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Payment Information</Label>
        <div className="rounded-lg border border-neutral-200 p-4 bg-white">
          <PaymentElement />
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-rose-900">Payment Error</p>
            <p className="text-sm text-rose-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Donate ${amount.toFixed(2)}
            {isRecurring && '/month'}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-neutral-500">
        Your payment is secured by Stripe and encrypted. We never see your card details.
      </p>
    </form>
  )
}
