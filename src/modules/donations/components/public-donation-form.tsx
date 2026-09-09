'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Heart, Loader2, Check, CreditCard } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { DonationForm } from '../schemas/donation.schema'

interface PublicDonationFormProps {
  orgSlug: string
  form: DonationForm
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export function PublicDonationForm({ orgSlug, form }: PublicDonationFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [donorInfo, setDonorInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const presetAmounts = (form.preset_amounts as number[]) || [25, 50, 100, 250, 500]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const getFinalAmount = (): number | null => {
    if (selectedAmount) return selectedAmount
    if (customAmount) {
      const amount = parseFloat(customAmount)
      return isNaN(amount) || amount <= 0 ? null : amount
    }
    return null
  }

  const handleCreatePaymentIntent = async () => {
    const amount = getFinalAmount()
    if (!amount) {
      setError('Please select or enter a donation amount')
      return
    }

    if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
      setError('Please fill in all required fields')
      return
    }

    setIsCreatingPayment(true)
    setError(null)

    try {
      const response = await fetch('/api/donations/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug,
          formSlug: form.slug,
          amount,
          isRecurring,
          donorInfo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      setClientSecret(data.clientSecret)
    } catch (err) {
      console.error('Payment creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize payment')
      setIsCreatingPayment(false)
    }
  }

  // If we have a client secret, show the payment form
  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#16804d',
              borderRadius: '0.625rem',
            },
          },
        }}
      >
        <CheckoutForm
          amount={getFinalAmount()!}
          isRecurring={isRecurring}
          donorEmail={donorInfo.email}
          orgSlug={orgSlug}
        />
      </Elements>
    )
  }

  return (
    <Card className="shadow-md-soft">
      <CardHeader className="border-b border-neutral-100">
        <CardTitle className="text-xl">Complete Your Donation</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Amount Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select Amount</Label>
          <div className="grid grid-cols-3 gap-3">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`
                  relative h-14 rounded-lg border-2 transition-all font-semibold
                  ${
                    selectedAmount === amount
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50/50'
                  }
                `}
              >
                ${amount}
                {selectedAmount === amount && (
                  <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {form.allow_custom_amount && (
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  $
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min={form.min_amount || 1}
                  max={form.max_amount || undefined}
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}
        </div>

        {/* Recurring Toggle */}
        {form.allow_recurring && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Donation Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsRecurring(false)}
                className={`
                  h-12 rounded-lg border-2 transition-all font-medium
                  ${
                    !isRecurring
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                  }
                `}
              >
                One-Time
              </button>
              <button
                onClick={() => setIsRecurring(true)}
                className={`
                  h-12 rounded-lg border-2 transition-all font-medium relative
                  ${
                    isRecurring
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300'
                  }
                `}
              >
                Monthly
                <Badge className="ml-2 bg-teal-100 text-teal-700 border-0">
                  Recurring
                </Badge>
              </button>
            </div>
          </div>
        )}

        {/* Donor Information */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Your Information</Label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="firstName"
                required
                value={donorInfo.firstName}
                onChange={(e) =>
                  setDonorInfo({ ...donorInfo, firstName: e.target.value })
                }
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="lastName"
                required
                value={donorInfo.lastName}
                onChange={(e) =>
                  setDonorInfo({ ...donorInfo, lastName: e.target.value })
                }
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={donorInfo.email}
              onChange={(e) =>
                setDonorInfo({ ...donorInfo, email: e.target.value })
              }
              placeholder="john.doe@example.com"
            />
            <p className="text-xs text-neutral-500">
              We'll send your receipt to this email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={donorInfo.phone}
              onChange={(e) =>
                setDonorInfo({ ...donorInfo, phone: e.target.value })
              }
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleCreatePaymentIntent}
          disabled={isCreatingPayment || !getFinalAmount()}
          className="w-full h-12 text-base font-semibold bg-primary-600 hover:bg-primary-700"
          size="lg"
        >
          {isCreatingPayment ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>

        {/* Summary */}
        {getFinalAmount() && (
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-sm text-neutral-600 mb-1">
              {isRecurring ? 'Monthly donation of' : 'One-time donation of'}
            </p>
            <p className="text-2xl font-bold text-primary-600">
              ${getFinalAmount()?.toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Checkout form component that handles the actual payment
function CheckoutForm({
  amount,
  isRecurring,
  donorEmail,
  orgSlug,
}: {
  amount: number
  isRecurring: boolean
  donorEmail: string
  orgSlug: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donate/${orgSlug}/thank-you?amount=${amount}&email=${encodeURIComponent(
            donorEmail
          )}&recurring=${isRecurring}`,
        },
      })

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('An unexpected error occurred')
      setIsProcessing(false)
    }
  }

  return (
    <Card className="shadow-md-soft">
      <CardHeader className="border-b border-neutral-100">
        <CardTitle className="text-xl">Payment Details</CardTitle>
        <p className="text-sm text-neutral-600 mt-2">
          {isRecurring ? 'Monthly donation of' : 'One-time donation of'}{' '}
          <span className="font-semibold text-primary-600">
            ${amount.toFixed(2)}
          </span>
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stripe Payment Element */}
          <div className="min-h-[200px]">
            <PaymentElement />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full h-12 text-base font-semibold bg-primary-600 hover:bg-primary-700"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 mr-2" />
                Complete Donation
              </>
            )}
          </Button>

          {/* Security Notice */}
          <p className="text-xs text-center text-neutral-500">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
