import Stripe from 'stripe'
import { getStripeEnv } from './config'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

/**
 * Stripe SDK Client
 *
 * Lazy-initialized Stripe client for server-side usage.
 * Uses the Stripe Node.js SDK to interact with Stripe API.
 */

let stripeClient: Stripe | null = null

// Cache for org-specific Stripe clients to avoid repeated DB lookups
const orgStripeClientCache = new Map<string, { client: Stripe; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get or create the Stripe client instance using environment variables.
 * @returns Configured Stripe client
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const { secretKey } = getStripeEnv()

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required to use Stripe features')
    }

    stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
      // Include app info for Stripe's analytics
      appInfo: {
        name: 'Flourish CRM',
        version: '1.0.0',
      },
    })
  }

  return stripeClient
}

/**
 * Create a Stripe client instance with a specific secret key.
 * @param secretKey - The Stripe secret key to use
 * @returns Configured Stripe client
 */
function createStripeClientWithKey(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
    appInfo: {
      name: 'Flourish CRM',
      version: '1.0.0',
    },
  })
}

/**
 * Get or create a Stripe client for a specific organization.
 * Fetches the organization's Stripe keys from the database and decrypts them.
 * Falls back to environment variables if the organization has no configured keys.
 *
 * @param orgId - The organization ID
 * @returns Configured Stripe client for the organization
 */
export async function getStripeClientForOrg(orgId: string): Promise<Stripe> {
  // Check cache first
  const now = Date.now()
  const cached = orgStripeClientCache.get(orgId)
  if (cached && cached.expiresAt > now) {
    return cached.client
  }

  // Fetch organization's Stripe settings from database
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('stripe_secret_key_encrypted, stripe_mode')
    .eq('id', orgId)
    .single()

  if (error) {
    console.warn(`Failed to fetch Stripe settings for org ${orgId}:`, error.message)
    // Fall back to env vars
    return getStripeClient()
  }

  // If org has no encrypted key, fall back to env vars
  if (!org.stripe_secret_key_encrypted) {
    return getStripeClient()
  }

  // Decrypt the secret key
  let decryptedSecretKey: string
  try {
    decryptedSecretKey = decrypt(org.stripe_secret_key_encrypted)
  } catch (decryptError) {
    console.error(`Failed to decrypt Stripe key for org ${orgId}:`, decryptError)
    // Fall back to env vars
    return getStripeClient()
  }

  // Create a new Stripe client with the org's key
  const client = createStripeClientWithKey(decryptedSecretKey)

  // Cache the client
  orgStripeClientCache.set(orgId, {
    client,
    expiresAt: now + CACHE_TTL_MS,
  })

  return client
}

/**
 * Get the webhook secret for a specific organization.
 * Fetches and decrypts the webhook secret from the database.
 * Falls back to environment variables if the organization has no configured webhook secret.
 *
 * @param orgId - The organization ID
 * @returns The webhook secret string
 */
export async function getWebhookSecretForOrg(orgId: string): Promise<string> {
  const supabase = createAdminClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('stripe_webhook_secret_encrypted')
    .eq('id', orgId)
    .single()

  if (error || !org.stripe_webhook_secret_encrypted) {
    // Fall back to env vars
    const { webhookSecret } = getStripeEnv()
    return webhookSecret
  }

  try {
    return decrypt(org.stripe_webhook_secret_encrypted)
  } catch (decryptError) {
    console.error(`Failed to decrypt webhook secret for org ${orgId}:`, decryptError)
    const { webhookSecret } = getStripeEnv()
    return webhookSecret
  }
}

/**
 * Clear the org Stripe client cache.
 * Useful when organization's Stripe settings are updated.
 *
 * @param orgId - Optional organization ID to clear. If not provided, clears entire cache.
 */
export function clearStripeClientCache(orgId?: string): void {
  if (orgId) {
    orgStripeClientCache.delete(orgId)
  } else {
    orgStripeClientCache.clear()
  }
}

/**
 * Create a Checkout Session for donation page
 * @param params Checkout session parameters
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
  amount: number
  currency?: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()

  const { amount, currency = 'usd', successUrl, cancelUrl, customerEmail, metadata } = params

  return await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'Donation',
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      source: 'flourish_crm',
      ...metadata,
    },
  })
}

/**
 * Create a PaymentIntent for a one-time donation
 * @param params Payment intent parameters
 * @returns Stripe PaymentIntent
 */
export async function createPaymentIntent(params: {
  amount: number
  currency?: string
  customerEmail?: string
  metadata?: Record<string, string>
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()

  const { amount, currency = 'usd', customerEmail, metadata } = params

  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: customerEmail,
    metadata: {
      source: 'flourish_crm',
      ...metadata,
    },
  })
}

/**
 * Create a Stripe Customer
 * @param params Customer parameters
 * @returns Stripe Customer
 */
export async function createCustomer(params: {
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  const stripe = getStripeClient()

  const { email, name, metadata } = params

  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'flourish_crm',
      ...metadata,
    },
  })
}

/**
 * Create a subscription for recurring donations
 * @param params Subscription parameters
 * @returns Stripe Subscription
 */
export async function createSubscription(params: {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()

  const { customerId, priceId, metadata } = params

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      source: 'flourish_crm',
      ...metadata,
    },
  })
}

/**
 * Create a Price for recurring donations
 * @param params Price parameters
 * @returns Stripe Price
 */
export async function createPrice(params: {
  amount: number
  interval: 'month' | 'year'
  currency?: string
  productName?: string
}): Promise<Stripe.Price> {
  const stripe = getStripeClient()

  const { amount, interval, currency = 'usd', productName = 'Donation' } = params

  // First, create a product
  const product = await stripe.products.create({
    name: productName,
    type: 'service',
  })

  // Then create a price for that product
  return await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency,
    recurring: {
      interval,
    },
  })
}

/**
 * Retrieve a PaymentIntent
 * @param paymentIntentId Payment Intent ID
 * @returns Stripe PaymentIntent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient()
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * Retrieve a Subscription
 * @param subscriptionId Subscription ID
 * @returns Stripe Subscription
 */
export async function retrieveSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel a subscription
 * @param subscriptionId Subscription ID
 * @returns Cancelled Stripe Subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Construct a Stripe webhook event from request
 * @param payload Request body as string
 * @param signature Stripe signature header
 * @param webhookSecret Webhook secret
 * @returns Stripe Event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
