'use server'

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
})

interface CreatePaymentIntentParams {
  amount: number // in cents
  organizationId: string
  formId: string
  donorEmail: string
  donorName: string
  isRecurring: boolean
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  try {
    const { amount, organizationId, formId, donorEmail, donorName, isRecurring } = params

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        organizationId,
        formId,
        donorEmail,
        donorName,
        isRecurring: isRecurring.toString(),
      },
      receipt_email: donorEmail !== 'placeholder@example.com' ? donorEmail : undefined,
      description: `Donation`,
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    }
  }
}

interface CreateSubscriptionParams {
  amount: number // in cents
  organizationId: string
  formId: string
  donorEmail: string
  donorName: string
  paymentMethodId: string
}

export async function createSubscription(params: CreateSubscriptionParams) {
  try {
    const { amount, organizationId, formId, donorEmail, donorName, paymentMethodId } = params

    // Create a customer
    const customer = await stripe.customers.create({
      email: donorEmail,
      name: donorName,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        organizationId,
        formId,
      },
    })

    // Create a price for the subscription
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Monthly Donation',
      },
      metadata: {
        organizationId,
        formId,
      },
    })

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        organizationId,
        formId,
        donorEmail,
        donorName,
      },
    })

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent
        ? ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent)
            ?.client_secret
        : null,
    }
  } catch (error) {
    console.error('Error creating subscription:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    }
  }
}
