'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { processDonation } from '../actions/process-donation'
import { recordDonation } from '../actions/record-donation'
import type { DonationForm, ProcessDonationInput } from '../schemas/donation.schema'
import {
  Heart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DonationWidgetProps {
  form: DonationForm
  organizationSlug: string
  className?: string
}

/**
 * Public-facing donation widget that donors use to make donations
 * Note: Stripe Elements integration is simplified for now
 */
export function DonationWidget({ form, organizationSlug, className }: DonationWidgetProps) {
  const [step, setStep] = useState<'amount' | 'info' | 'payment' | 'success'>('amount')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [frequency, setFrequency] = useState<ProcessDonationInput['frequency']>(
    form.default_frequency as ProcessDonationInput['frequency']
  )

  const [donorInfo, setDonorInfo] = useState({
    donor_first_name: '',
    donor_last_name: '',
    donor_email: '',
    donor_phone: '',
    donor_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    },
  })

  const [donationId, setDonationId] = useState<string | null>(null)

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount || 0

  const handleAmountSelect = (amt: number) => {
    setSelectedAmount(amt)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleContinueToInfo = () => {
    setError(null)

    if (!amount || amount < (form.min_amount || 1)) {
      setError(`Minimum donation amount is $${form.min_amount || 1}`)
      return
    }

    if (form.max_amount && amount > form.max_amount) {
      setError(`Maximum donation amount is $${form.max_amount}`)
      return
    }

    setStep('info')
  }

  const handleContinueToPayment = () => {
    setError(null)

    // Validate donor info
    if (!donorInfo.donor_first_name || !donorInfo.donor_last_name) {
      setError('Please enter your name')
      return
    }

    if (form.require_email && !donorInfo.donor_email) {
      setError('Email is required')
      return
    }

    if (form.require_phone && !donorInfo.donor_phone) {
      setError('Phone number is required')
      return
    }

    if (
      form.require_address &&
      (!donorInfo.donor_address.street ||
        !donorInfo.donor_address.city ||
        !donorInfo.donor_address.state ||
        !donorInfo.donor_address.zip)
    ) {
      setError('Complete address is required')
      return
    }

    setStep('payment')
  }

  const handleSubmitDonation = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      // Process donation (creates payment intent in real implementation)
      const processResult = await processDonation(organizationSlug, {
        donation_form_slug: form.slug,
        amount,
        frequency,
        ...donorInfo,
        campaign: form.campaign || undefined,
      })

      if (!processResult.success) {
        throw new Error(processResult.error)
      }

      setDonationId(processResult.data!.donationId)

      // In a real implementation, you would:
      // 1. Use Stripe Elements to collect card details
      // 2. Confirm the payment intent with Stripe
      // 3. Call recordDonation on success

      // For now, simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Record the donation as completed
      const recordResult = await recordDonation(processResult.data!.donationId)

      if (!recordResult.success) {
        throw new Error(recordResult.error)
      }

      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            {form.title}
          </CardTitle>
          {step !== 'success' && (
            <div className="flex gap-2">
              {['amount', 'info', 'payment'].map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-2 w-8 rounded-full transition-colors',
                    step === s
                      ? 'bg-primary-600'
                      : ['amount', 'info', 'payment'].indexOf(step) > i
                      ? 'bg-primary-300'
                      : 'bg-neutral-200'
                  )}
                />
              ))}
            </div>
          )}
        </div>
        {form.description && <CardDescription className="text-base">{form.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Step 1: Amount Selection */}
        {step === 'amount' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Donation Amount</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {form.preset_amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className={cn(
                      'px-6 py-4 border-2 rounded-lg transition-all font-semibold text-lg',
                      selectedAmount === amt
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                    )}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {form.allow_custom_amount && (
                <div className="space-y-2 pt-2">
                  <Label>Or Enter Custom Amount</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                      $
                    </span>
                    <Input
                      type="number"
                      min={form.min_amount}
                      max={form.max_amount || undefined}
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 h-12 text-lg"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Minimum: ${form.min_amount}
                    {form.max_amount && ` | Maximum: $${form.max_amount}`}
                  </p>
                </div>
              )}
            </div>

            {form.allow_recurring && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Frequency</Label>
                <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time donation</SelectItem>
                    <SelectItem value="monthly">Monthly (recurring)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (recurring)</SelectItem>
                    <SelectItem value="annually">Annually (recurring)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleContinueToInfo}
                disabled={!amount}
                className="w-full h-12 text-base"
                size="lg"
              >
                Continue to Information
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Donor Information */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <span className="text-sm text-neutral-600">Donation Amount:</span>
              <span className="text-2xl font-bold text-primary-700">${amount.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      id="first_name"
                      value={donorInfo.donor_first_name}
                      onChange={(e) =>
                        setDonorInfo({ ...donorInfo, donor_first_name: e.target.value })
                      }
                      placeholder="First name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    value={donorInfo.donor_last_name}
                    onChange={(e) =>
                      setDonorInfo({ ...donorInfo, donor_last_name: e.target.value })
                    }
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {form.collect_donor_info && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email {form.require_email && <span className="text-rose-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="email"
                        type="email"
                        value={donorInfo.donor_email}
                        onChange={(e) =>
                          setDonorInfo({ ...donorInfo, donor_email: e.target.value })
                        }
                        placeholder="you@example.com"
                        className="pl-10"
                        required={form.require_email}
                      />
                    </div>
                  </div>

                  {(form.require_phone || true) && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone {form.require_phone && <span className="text-rose-500">*</span>}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={donorInfo.donor_phone}
                          onChange={(e) =>
                            setDonorInfo({ ...donorInfo, donor_phone: e.target.value })
                          }
                          placeholder="(555) 123-4567"
                          className="pl-10"
                          required={form.require_phone}
                        />
                      </div>
                    </div>
                  )}

                  {form.require_address && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Mailing Address <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={donorInfo.donor_address.street}
                        onChange={(e) =>
                          setDonorInfo({
                            ...donorInfo,
                            donor_address: { ...donorInfo.donor_address, street: e.target.value },
                          })
                        }
                        placeholder="Street address"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={donorInfo.donor_address.city}
                          onChange={(e) =>
                            setDonorInfo({
                              ...donorInfo,
                              donor_address: { ...donorInfo.donor_address, city: e.target.value },
                            })
                          }
                          placeholder="City"
                          required
                        />
                        <Input
                          value={donorInfo.donor_address.state}
                          onChange={(e) =>
                            setDonorInfo({
                              ...donorInfo,
                              donor_address: { ...donorInfo.donor_address, state: e.target.value },
                            })
                          }
                          placeholder="State"
                          required
                        />
                      </div>
                      <Input
                        value={donorInfo.donor_address.zip}
                        onChange={(e) =>
                          setDonorInfo({
                            ...donorInfo,
                            donor_address: { ...donorInfo.donor_address, zip: e.target.value },
                          })
                        }
                        placeholder="ZIP code"
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep('amount')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleContinueToPayment} className="flex-1">
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm text-neutral-600">
                  {frequency === 'one-time' ? 'One-time' : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`} Donation
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {donorInfo.donor_first_name} {donorInfo.donor_last_name}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary-700">${amount.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </Label>

              {/* Placeholder for Stripe Elements */}
              <div className="p-6 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50">
                <p className="text-center text-sm text-neutral-500">
                  Stripe Elements Card Input
                </p>
                <p className="text-center text-xs text-neutral-400 mt-2">
                  (Integration with @stripe/stripe-js required)
                </p>
              </div>

              <p className="text-xs text-neutral-500 text-center">
                Your payment information is secure and encrypted
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setStep('info')} variant="outline" className="flex-1" disabled={isSubmitting}>
                Back
              </Button>
              <Button
                onClick={handleSubmitDonation}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Complete Donation
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-neutral-900">Thank You!</h3>
              <p className="text-lg text-neutral-600">
                Your donation of ${amount.toFixed(2)} has been received
              </p>
            </div>

            {form.thank_you_message && (
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-neutral-700">{form.thank_you_message}</p>
              </div>
            )}

            <p className="text-sm text-neutral-500">
              A receipt has been sent to {donorInfo.donor_email}
            </p>

            {form.redirect_url && (
              <Button
                onClick={() => (window.location.href = form.redirect_url!)}
                variant="outline"
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
