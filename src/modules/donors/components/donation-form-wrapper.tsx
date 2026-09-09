'use client'

import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { DonationForm } from './donation-form'
import { createPaymentIntent } from '../actions/create-payment-intent'
import { Loader2 } from 'lucide-react'

interface DonationFormWrapperProps {
  organizationId: string
  organizationName: string
  orgSlug: string
  formId: string
  formName: string
  suggestedAmounts: number[]
  defaultAmount?: number
  allowCustomAmount: boolean
  allowRecurring: boolean
  stripePublishableKey: string
}

let stripePromise: Promise<Stripe | null> | null = null

export function DonationFormWrapper({
  organizationId,
  organizationName,
  orgSlug,
  formId,
  formName,
  suggestedAmounts,
  defaultAmount,
  allowCustomAmount,
  allowRecurring,
  stripePublishableKey,
}: DonationFormWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Stripe
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey)
  }

  useEffect(() => {
    // Create a payment intent with a placeholder amount to initialize the form
    // The actual amount will be determined when the user submits
    const initializePayment = async () => {
      try {
        const initialAmount = defaultAmount || (suggestedAmounts.length > 0 ? suggestedAmounts[0] : 50)

        const result = await createPaymentIntent({
          amount: initialAmount * 100, // Convert to cents
          organizationId,
          formId,
          donorEmail: 'placeholder@example.com', // Will be updated when form is submitted
          donorName: 'Placeholder Donor', // Will be updated when form is submitted
          isRecurring: false,
        })

        if (result.success && result.clientSecret) {
          setClientSecret(result.clientSecret)
        } else {
          setError(result.error || 'Failed to initialize payment')
        }
      } catch (err) {
        console.error('Error initializing payment:', err)
        setError('Failed to initialize payment form')
      } finally {
        setIsLoading(false)
      }
    }

    initializePayment()
  }, [organizationId, formId, organizationName, defaultAmount, suggestedAmounts])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="text-sm text-neutral-600">Loading payment form...</p>
        </div>
      </div>
    )
  }

  if (error || !clientSecret) {
    return (
      <div className="rounded-lg bg-rose-50 border border-rose-200 p-6">
        <p className="text-rose-900 font-medium">Unable to load payment form</p>
        <p className="text-sm text-rose-700 mt-1">
          {error || 'Please try again later or contact support.'}
        </p>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#16804d',
            colorBackground: '#ffffff',
            colorText: '#1c1917',
            colorDanger: '#e11d48',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <DonationForm
        organizationId={organizationId}
        organizationName={organizationName}
        orgSlug={orgSlug}
        formId={formId}
        formName={formName}
        suggestedAmounts={suggestedAmounts}
        defaultAmount={defaultAmount}
        allowCustomAmount={allowCustomAmount}
        allowRecurring={allowRecurring}
      />
    </Elements>
  )
}
