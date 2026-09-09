/**
 * Stripe Helper Functions
 *
 * Utility functions for working with Stripe in the application
 */

import { getStripeClient } from './client'
import type { DonationSummary } from './types'

/**
 * Format amount from cents to dollars
 * @param amountInCents Amount in cents
 * @returns Amount in dollars
 */
export function formatAmount(amountInCents: number): number {
  return amountInCents / 100
}

/**
 * Format amount from dollars to cents
 * @param amountInDollars Amount in dollars
 * @returns Amount in cents
 */
export function formatAmountToCents(amountInDollars: number): number {
  return Math.round(amountInDollars * 100)
}

/**
 * Format currency for display
 * @param amount Amount
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

/**
 * Get payment method details from PaymentIntent
 * @param paymentIntentId Payment Intent ID
 * @returns Payment method details or null
 */
export async function getPaymentMethodDetails(paymentIntentId: string): Promise<{
  brand?: string
  last4?: string
  type: string
} | null> {
  try {
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent.payment_method) {
      return null
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method as string
    )

    if (paymentMethod.type === 'card' && paymentMethod.card) {
      return {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        type: 'card',
      }
    }

    return {
      type: paymentMethod.type,
    }
  } catch (error) {
    console.error('Error fetching payment method details:', error)
    return null
  }
}

/**
 * Get donation summary for a customer
 * @param customerId Stripe Customer ID
 * @param startDate Start date for summary
 * @param endDate End date for summary
 * @returns Donation summary
 */
export async function getCustomerDonationSummary(
  customerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DonationSummary | null> {
  try {
    const stripe = getStripeClient()

    // Fetch all payment intents for the customer
    interface PaymentIntentListParams {
      customer: string
      limit: number
      created?: {
        gte?: number
        lte?: number
      }
    }

    const params: PaymentIntentListParams = {
      customer: customerId,
      limit: 100,
    }

    if (startDate) {
      params.created = {
        gte: Math.floor(startDate.getTime() / 1000),
      }
    }

    if (endDate) {
      params.created = {
        ...params.created,
        lte: Math.floor(endDate.getTime() / 1000),
      }
    }

    const paymentIntents = await stripe.paymentIntents.list(params)

    // Filter successful payments
    const successfulPayments = paymentIntents.data.filter(
      (pi) => pi.status === 'succeeded'
    )

    if (successfulPayments.length === 0) {
      return null
    }

    // Calculate totals (assuming same currency for all payments)
    const totalAmount = successfulPayments.reduce(
      (sum, pi) => sum + pi.amount,
      0
    )

    return {
      totalAmount: formatAmount(totalAmount),
      totalDonations: successfulPayments.length,
      currency: successfulPayments[0].currency.toUpperCase(),
      period: {
        start: startDate || new Date(successfulPayments[successfulPayments.length - 1].created * 1000),
        end: endDate || new Date(successfulPayments[0].created * 1000),
      },
    }
  } catch (error) {
    console.error('Error fetching customer donation summary:', error)
    return null
  }
}

/**
 * Validate webhook signature
 * @param payload Request body
 * @param signature Stripe signature
 * @param secret Webhook secret
 * @returns True if valid, false otherwise
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const stripe = getStripeClient()
    stripe.webhooks.constructEvent(payload, signature, secret)
    return true
  } catch (error) {
    console.error('Invalid webhook signature:', error)
    return false
  }
}

/**
 * Get customer by email
 * @param email Email address
 * @returns Stripe Customer or null
 */
export async function getCustomerByEmail(email: string) {
  try {
    const stripe = getStripeClient()
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })

    return customers.data.length > 0 ? customers.data[0] : null
  } catch (error) {
    console.error('Error fetching customer by email:', error)
    return null
  }
}

/**
 * Check if subscription is active
 * @param subscriptionId Subscription ID
 * @returns True if active, false otherwise
 */
export async function isSubscriptionActive(subscriptionId: string): Promise<boolean> {
  try {
    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription.status === 'active' || subscription.status === 'trialing'
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return false
  }
}

/**
 * Update subscription amount
 * @param subscriptionId Subscription ID
 * @param newAmount New amount in dollars
 * @returns Updated subscription or null
 */
export async function updateSubscriptionAmount(
  subscriptionId: string,
  newAmount: number
) {
  try {
    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!subscription.items.data[0]) {
      throw new Error('No subscription items found')
    }

    // Create new price
    const currentPrice = await stripe.prices.retrieve(
      subscription.items.data[0].price.id
    )

    if (!currentPrice.recurring) {
      throw new Error('Not a recurring price')
    }

    const newPrice = await stripe.prices.create({
      product: currentPrice.product as string,
      unit_amount: formatAmountToCents(newAmount),
      currency: currentPrice.currency,
      recurring: {
        interval: currentPrice.recurring.interval,
      },
    })

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPrice.id,
        },
      ],
    })

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription amount:', error)
    return null
  }
}

/**
 * Refund a payment
 * @param paymentIntentId Payment Intent ID
 * @param amount Optional partial refund amount in dollars
 * @param reason Refund reason
 * @returns Refund object or null
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const stripe = getStripeClient()

    interface RefundParams {
      payment_intent: string
      amount?: number
      reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
    }

    const params: RefundParams = {
      payment_intent: paymentIntentId,
    }

    if (amount) {
      params.amount = formatAmountToCents(amount)
    }

    if (reason) {
      params.reason = reason
    }

    const refund = await stripe.refunds.create(params)
    return refund
  } catch (error) {
    console.error('Error processing refund:', error)
    return null
  }
}
