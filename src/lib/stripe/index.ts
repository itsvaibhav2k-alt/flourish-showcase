/**
 * Stripe Integration
 *
 * Main export file for Stripe integration module
 */

// Client functions
export {
  getStripeClient,
  createCheckoutSession,
  createPaymentIntent,
  createCustomer,
  createSubscription,
  createPrice,
  retrievePaymentIntent,
  retrieveSubscription,
  cancelSubscription,
  constructWebhookEvent,
} from './client'

// Configuration
export {
  STRIPE_CONFIG,
  getStripeEnv,
  type WebhookEvent,
  type DonationType,
  type RecurringInterval,
} from './config'

// Types
export type {
  CreatePaymentIntentParams,
  CreateCustomerParams,
  CreateSubscriptionParams,
  CreatePriceParams,
  DonationRecord,
  ContactFromPayment,
  WebhookHandlerResult,
  ReceiptEmailParams,
  StripeMetadata,
  DonationSummary,
  Stripe,
} from './types'

export {
  isStripeMetadata,
  extractOrganizationId,
  extractContactId,
} from './types'

// Helper functions
export {
  formatAmount,
  formatAmountToCents,
  formatCurrency,
  getPaymentMethodDetails,
  getCustomerDonationSummary,
  validateWebhookSignature,
  getCustomerByEmail,
  isSubscriptionActive,
  updateSubscriptionAmount,
  refundPayment,
} from './helpers'
