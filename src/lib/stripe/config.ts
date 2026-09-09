/**
 * Stripe Configuration
 *
 * Constants and configuration for Stripe integration
 */

export const STRIPE_CONFIG = {
  // Currency for donations (USD by default)
  currency: 'usd',

  // Default payment method types
  paymentMethodTypes: ['card'],

  // Webhook events we handle
  webhookEvents: [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.subscription.created',
    'customer.subscription.deleted',
  ] as const,

  // Donation types
  donationTypes: {
    ONE_TIME: 'one_time',
    RECURRING: 'recurring',
  } as const,

  // Recurring intervals
  recurringIntervals: {
    MONTHLY: 'month',
    YEARLY: 'year',
  } as const,
} as const

export type WebhookEvent = (typeof STRIPE_CONFIG.webhookEvents)[number]
export type DonationType = (typeof STRIPE_CONFIG.donationTypes)[keyof typeof STRIPE_CONFIG.donationTypes]
export type RecurringInterval = (typeof STRIPE_CONFIG.recurringIntervals)[keyof typeof STRIPE_CONFIG.recurringIntervals]

/**
 * Get Stripe environment variables
 * Returns variables or throws at runtime if not set
 */
export function getStripeEnv() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Only throw at runtime, not during build
  if (typeof window === 'undefined' && !secretKey) {
    console.warn('STRIPE_SECRET_KEY is not set - Stripe features will not work')
  }

  return {
    secretKey: secretKey || '',
    publishableKey: publishableKey || '',
    webhookSecret: webhookSecret || '', // Can be empty in development
  }
}
