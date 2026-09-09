/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for donation tracking and management.
 * Handles payment events and subscription lifecycle events.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { constructWebhookEvent, getStripeClient } from '@/lib/stripe/client'
import { getStripeEnv } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { logGiftActivity, logContactActivity } from '@/lib/activity'
import { sendEmail } from '@/lib/email/resend'

/**
 * Disable body parsing - Stripe needs raw body for signature verification
 */
export const runtime = 'nodejs'

/**
 * POST handler for Stripe webhooks
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const { webhookSecret } = getStripeEnv()
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log(`Received Stripe webhook: ${event.type}`)

    // Route event to appropriate handler
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
    } else if (event.type === 'payment_intent.succeeded') {
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
    } else if (event.type === 'customer.subscription.created') {
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
    } else if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
    } else {
      console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle completed checkout session
 * Processes payment when checkout session is completed successfully
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const supabase = createAdminClient()

    // Extract metadata
    const organizationId = session.metadata?.organizationId || session.metadata?.organization_id
    const contactId = session.metadata?.contactId || session.metadata?.contact_id
    const campaign = session.metadata?.campaign
    const giftType = session.metadata?.giftType || session.metadata?.gift_type || 'online'

    if (!organizationId) {
      console.error('Checkout session completed but no organization ID in metadata:', session.id)
      return
    }

    // Calculate amount in dollars
    const amount = session.amount_total ? session.amount_total / 100 : 0
    const currency = session.currency?.toUpperCase() || 'USD'

    let finalContactId = contactId

    // If no contact ID, try to find or create contact from customer email
    if (!finalContactId && session.customer_details?.email) {
      finalContactId = await findOrCreateContact({
        email: session.customer_details.email,
        organizationId,
        metadata: {
          firstName: session.customer_details.name?.split(' ')[0] || 'Online',
          lastName: session.customer_details.name?.split(' ').slice(1).join(' ') || 'Donor',
          ...(session.metadata || {}),
        },
      })
    }

    if (!finalContactId) {
      console.error('Cannot process checkout session - no contact information available:', session.id)
      return
    }

    // Check if gift already exists (idempotency)
    const { data: existingGift } = await supabase
      .from('gifts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('notes', `Stripe Checkout Session ID: ${session.id}`)
      .single()

    if (existingGift) {
      console.log('Gift already recorded for checkout session:', session.id)
      return
    }

    // Record gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        organization_id: organizationId,
        contact_id: finalContactId,
        amount,
        gift_date: new Date().toISOString(),
        gift_type: giftType,
        campaign: campaign || 'Online Donation',
        payment_method: 'stripe',
        notes: `Stripe Checkout Session ID: ${session.id}\nPayment Intent: ${session.payment_intent}\nCurrency: ${currency}`,
      })
      .select('id')
      .single()

    if (giftError) {
      console.error('Error recording gift from checkout session:', giftError)
      return
    }

    console.log('Gift recorded successfully from checkout session:', gift.id)

    // Update contact's is_donor flag
    const { data: contact } = await supabase
      .from('contacts')
      .select('is_donor, email')
      .eq('id', finalContactId)
      .single()

    if (contact && !contact.is_donor) {
      await supabase
        .from('contacts')
        .update({ is_donor: true })
        .eq('id', finalContactId)
    }

    // Log activity
    await logGiftActivity({
      organizationId,
      contactId: finalContactId,
      giftId: gift.id,
      amount,
      giftType,
      action: 'recorded',
    })

    // Trigger thank-you email generation via Inngest
    try {
      await inngest.send({
        name: 'gift/created',
        data: {
          giftId: gift.id,
          contactId: finalContactId,
          organizationId,
          amount,
        },
      })
    } catch (inngestError) {
      console.warn('Failed to trigger thank-you email generation:', inngestError)
    }

    // Send receipt email if available
    if (contact?.email) {
      await sendReceiptEmail({
        email: contact.email,
        amount,
        currency,
        paymentIntentId: session.payment_intent as string,
      })
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error)
  }
}

/**
 * Handle successful payment intent
 * Creates/updates contact and records gift in database
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const supabase = createAdminClient()

    // Extract metadata
    const organizationId = paymentIntent.metadata.organizationId || paymentIntent.metadata.organization_id
    const contactId = paymentIntent.metadata.contactId || paymentIntent.metadata.contact_id
    const campaign = paymentIntent.metadata.campaign
    const giftType = paymentIntent.metadata.giftType || paymentIntent.metadata.gift_type || 'online'

    if (!organizationId) {
      console.error('Payment succeeded but no organization ID in metadata:', paymentIntent.id)
      return
    }

    // Calculate amount in dollars
    const amount = paymentIntent.amount / 100
    const currency = paymentIntent.currency.toUpperCase()

    let finalContactId = contactId

    // If no contact ID, try to find or create contact from customer email
    if (!finalContactId) {
      const customerEmail = paymentIntent.receipt_email ||
        (paymentIntent.customer ? await getCustomerEmail(paymentIntent.customer as string) : null)

      if (customerEmail) {
        const foundContactId = await findOrCreateContact({
          email: customerEmail,
          organizationId,
          metadata: paymentIntent.metadata,
        })

        if (foundContactId) {
          finalContactId = foundContactId
        }
      }
    }

    if (!finalContactId) {
      console.error('Cannot process payment - no contact information available:', paymentIntent.id)
      return
    }

    // Check if gift already exists (idempotency)
    const { data: existingGift } = await supabase
      .from('gifts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('notes', `Stripe Payment ID: ${paymentIntent.id}`)
      .single()

    if (existingGift) {
      console.log('Gift already recorded for payment:', paymentIntent.id)
      return
    }

    // Record gift
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        organization_id: organizationId,
        contact_id: finalContactId,
        amount,
        gift_date: new Date().toISOString(),
        gift_type: giftType,
        campaign: campaign || 'Online Donation',
        payment_method: 'stripe',
        notes: `Stripe Payment ID: ${paymentIntent.id}\nCurrency: ${currency}`,
      })
      .select('id')
      .single()

    if (giftError) {
      console.error('Error recording gift:', giftError)
      return
    }

    console.log('Gift recorded successfully:', gift.id)

    // Update contact's is_donor flag
    const { data: contact } = await supabase
      .from('contacts')
      .select('is_donor, email')
      .eq('id', finalContactId)
      .single()

    if (contact && !contact.is_donor) {
      await supabase
        .from('contacts')
        .update({ is_donor: true })
        .eq('id', finalContactId)
    }

    // Log activity
    await logGiftActivity({
      organizationId,
      contactId: finalContactId,
      giftId: gift.id,
      amount,
      giftType,
      action: 'recorded',
    })

    // Trigger thank-you email generation via Inngest
    try {
      await inngest.send({
        name: 'gift/created',
        data: {
          giftId: gift.id,
          contactId: finalContactId,
          organizationId,
          amount,
        },
      })
    } catch (inngestError) {
      console.warn('Failed to trigger thank-you email generation:', inngestError)
    }

    // Send receipt email if available
    if (contact?.email) {
      await sendReceiptEmail({
        email: contact.email,
        amount,
        currency,
        paymentIntentId: paymentIntent.id,
      })
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error)
  }
}

/**
 * Handle failed payment intent
 * Logs the failure for tracking
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      lastError: paymentIntent.last_payment_error?.message,
    })

    // Optionally, notify the organization about the failed payment
    // This could be implemented as an alert in the dashboard
  } catch (error) {
    console.error('Error handling payment_intent.failed:', error)
  }
}

/**
 * Handle subscription creation
 * Records the initial subscription in metadata for future recurring donations
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const supabase = createAdminClient()

    const organizationId = subscription.metadata.organizationId || subscription.metadata.organization_id
    const contactId = subscription.metadata.contactId || subscription.metadata.contact_id

    if (!organizationId || !contactId) {
      console.error('Subscription created but missing organization or contact ID:', subscription.id)
      return
    }

    console.log('Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      contactId,
    })

    // Store subscription details in contact metadata or separate subscriptions table
    // For now, we'll add a note to track this
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contact) {
      // Add a note about the recurring donation subscription
      await supabase.from('contact_notes').insert({
        organization_id: organizationId,
        contact_id: contactId,
        content: `Recurring donation subscription started (${subscription.id})\nStatus: ${subscription.status}`,
      })

      // Log activity
      await logContactActivity({
        organizationId,
        contactId,
        action: 'updated',
        changes: { subscription_status: subscription.status },
      })
    }
  } catch (error) {
    console.error('Error handling customer.subscription.created:', error)
  }
}

/**
 * Handle subscription deletion/cancellation
 * Updates records to reflect cancelled recurring donation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const supabase = createAdminClient()

    const organizationId = subscription.metadata.organizationId || subscription.metadata.organization_id
    const contactId = subscription.metadata.contactId || subscription.metadata.contact_id

    if (!organizationId || !contactId) {
      console.error('Subscription deleted but missing organization or contact ID:', subscription.id)
      return
    }

    console.log('Subscription cancelled:', {
      id: subscription.id,
      status: subscription.status,
      contactId,
    })

    // Add a note about the cancellation
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    if (contact) {
      await supabase.from('contact_notes').insert({
        organization_id: organizationId,
        contact_id: contactId,
        content: `Recurring donation subscription cancelled (${subscription.id})\nCancelled at: ${new Date(subscription.canceled_at! * 1000).toISOString()}`,
      })

      // Log activity
      await logContactActivity({
        organizationId,
        contactId,
        action: 'updated',
        changes: { subscription_status: 'cancelled' },
      })
    }
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error)
  }
}

/**
 * Find or create a contact from email address
 * Used when payment doesn't have a pre-existing contact ID
 */
async function findOrCreateContact(params: {
  email: string
  organizationId: string
  metadata: Record<string, string>
}): Promise<string | null> {
  try {
    const { email, organizationId, metadata } = params
    const supabase = createAdminClient()

    // Try to find existing contact by email
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .single()

    if (existingContact) {
      return existingContact.id
    }

    // Create new contact
    const firstName = metadata.firstName || metadata.first_name || 'Online'
    const lastName = metadata.lastName || metadata.last_name || 'Donor'

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        first_name: firstName,
        last_name: lastName,
        email,
        is_donor: true,
        tags: ['online-donor'],
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return null
    }

    // Log activity for new contact
    await logContactActivity({
      organizationId,
      contactId: newContact.id,
      action: 'created',
    })

    return newContact.id
  } catch (error) {
    console.error('Error in findOrCreateContact:', error)
    return null
  }
}

/**
 * Get customer email from Stripe customer object
 */
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const stripe = getStripeClient()
    const customer = await stripe.customers.retrieve(customerId)

    if (customer.deleted) {
      return null
    }

    return customer.email || null
  } catch (error) {
    console.error('Error fetching customer email:', error)
    return null
  }
}

/**
 * Send donation receipt email
 */
async function sendReceiptEmail(params: {
  email: string
  amount: number
  currency: string
  paymentIntentId: string
}) {
  try {
    const { email, amount, currency, paymentIntentId } = params

    const result = await sendEmail({
      to: email,
      subject: 'Thank you for your donation!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your generous donation!</h2>
          <p>We have received your donation of <strong>${currency} ${amount.toFixed(2)}</strong>.</p>
          <p>Your support makes a real difference and helps us continue our important work.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Transaction ID: ${paymentIntentId}<br>
            This email serves as your receipt for tax purposes.
          </p>
        </div>
      `,
    })

    if (!result.success) {
      console.error('Failed to send receipt email:', result.error)
    }
  } catch (error) {
    console.error('Error sending receipt email:', error)
  }
}
