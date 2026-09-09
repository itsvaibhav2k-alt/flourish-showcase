import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordDonation } from '@/modules/donors/actions/record-donation'

// Lazy-initialize Stripe client to avoid build-time errors
function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  })
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!webhookSecret) {
      console.warn('Stripe webhook secret not configured, skipping signature verification')
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        // For development, parse without verification
        event = JSON.parse(body) as Stripe.Event
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Extract metadata - support both old (organizationId) and new (organization_id) formats
        const organizationId = paymentIntent.metadata.organization_id || paymentIntent.metadata.organizationId
        const donationId = paymentIntent.metadata.donation_id
        const formId = paymentIntent.metadata.donation_form_id || paymentIntent.metadata.formId
        const donorEmail = paymentIntent.metadata.donor_email || paymentIntent.metadata.donorEmail
        const donorName = paymentIntent.metadata.donor_name || paymentIntent.metadata.donorName
        const isRecurring = paymentIntent.metadata.is_recurring || paymentIntent.metadata.isRecurring

        // If we have a donation_id, update that record directly
        if (donationId) {
          const supabase = createAdminClient()

          // Update donation status to completed
          const { error: updateError } = await supabase
            .from('donations')
            .update({
              status: 'completed',
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq('id', donationId)

          if (updateError) {
            console.error('Error updating donation status:', updateError)
            // Continue processing - the donation might still need to be recorded as a gift
          } else {
            console.log('Donation status updated to completed:', donationId)
          }
        }

        // Also record as a gift for donors module if we have org info
        if (organizationId && donorEmail && donorName) {
          // Split donor name into first and last
          const nameParts = donorName.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          // Record the donation in the database
          await recordDonation({
            organizationId,
            formId: formId || '',
            firstName,
            lastName,
            email: donorEmail,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
            isRecurring: isRecurring === 'true',
            stripePaymentIntentId: paymentIntent.id,
          })

          console.log('Payment intent succeeded and donation recorded:', paymentIntent.id)
        } else if (!donationId) {
          // Only warn if we don't have donation_id either
          console.warn('Payment intent succeeded but missing metadata for recording:', paymentIntent.id)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        // Handle successful recurring payment
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) {
          break
        }

        // Get subscription to access metadata
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )

        const {
          organizationId,
          formId,
          donorEmail,
          donorName,
        } = subscription.metadata

        if (!organizationId || !formId || !donorEmail || !donorName) {
          console.error('Missing required metadata in subscription')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Split donor name
        const nameParts = donorName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Record the recurring donation payment
        await recordDonation({
          organizationId,
          formId,
          firstName,
          lastName,
          email: donorEmail,
          amount: (invoice.amount_paid || 0) / 100,
          isRecurring: true,
          stripeSubscriptionId: subscription.id,
        })

        console.log('Subscription payment succeeded and donation recorded:', invoice.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription cancelled:', subscription.id)
        // You could add logic here to mark the subscription as cancelled in your database
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)

        // Update donation status to failed if we have donation_id
        const donationId = paymentIntent.metadata.donation_id
        if (donationId) {
          const supabase = createAdminClient()

          const { error: updateError } = await supabase
            .from('donations')
            .update({
              status: 'failed',
              notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
            })
            .eq('id', donationId)

          if (updateError) {
            console.error('Error updating donation status to failed:', updateError)
          } else {
            console.log('Donation status updated to failed:', donationId)
          }
        }

        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
