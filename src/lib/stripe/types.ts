/**
 * Stripe Integration Types
 *
 * TypeScript types for Stripe integration
 */

import type Stripe from 'stripe'

/**
 * Payment Intent creation parameters
 */
export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  customerEmail?: string
  metadata?: {
    organizationId?: string
    contactId?: string
    campaign?: string
    giftType?: string
    [key: string]: string | undefined
  }
}

/**
 * Customer creation parameters
 */
export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: {
    organizationId?: string
    contactId?: string
    [key: string]: string | undefined
  }
}

/**
 * Subscription creation parameters
 */
export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  metadata?: {
    organizationId?: string
    contactId?: string
    donationType?: string
    [key: string]: string | undefined
  }
}

/**
 * Price creation parameters
 */
export interface CreatePriceParams {
  amount: number
  interval: 'month' | 'year'
  currency?: string
  productName?: string
}

/**
 * Donation record for database
 */
export interface DonationRecord {
  organizationId: string
  contactId: string
  amount: number
  currency: string
  giftType: string
  campaign?: string
  paymentMethod: 'stripe'
  stripePaymentIntentId: string
  metadata?: Record<string, unknown>
}

/**
 * Contact creation from payment
 */
export interface ContactFromPayment {
  organizationId: string
  email: string
  firstName?: string
  lastName?: string
  isDonor: true
  tags?: string[]
}

/**
 * Webhook event handler result
 */
export interface WebhookHandlerResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * Receipt email parameters
 */
export interface ReceiptEmailParams {
  email: string
  amount: number
  currency: string
  paymentIntentId: string
  donorName?: string
}

/**
 * Stripe metadata for tracking donations
 */
export interface StripeMetadata {
  organizationId?: string
  organization_id?: string
  contactId?: string
  contact_id?: string
  campaign?: string
  giftType?: string
  gift_type?: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  [key: string]: string | undefined
}

/**
 * Type guard to check if object is Stripe metadata
 */
export function isStripeMetadata(obj: unknown): obj is StripeMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('organizationId' in obj || 'organization_id' in obj)
  )
}

/**
 * Extract organization ID from metadata (handles both formats)
 */
export function extractOrganizationId(metadata: StripeMetadata): string | undefined {
  return metadata.organizationId || metadata.organization_id
}

/**
 * Extract contact ID from metadata (handles both formats)
 */
export function extractContactId(metadata: StripeMetadata): string | undefined {
  return metadata.contactId || metadata.contact_id
}

/**
 * Donation summary for reporting
 */
export interface DonationSummary {
  totalAmount: number
  totalDonations: number
  currency: string
  period: {
    start: Date
    end: Date
  }
}

// Re-export commonly used Stripe types
export type {
  Stripe,
}
