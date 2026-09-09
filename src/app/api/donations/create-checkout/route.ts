import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent, createCustomer, createPrice, createSubscription } from '@/lib/stripe/client'
import { getCustomerByEmail } from '@/lib/stripe/helpers'

const createCheckoutSchema = z.object({
  orgSlug: z.string(),
  formSlug: z.string(),
  amount: z.number().positive(),
  isRecurring: z.boolean(),
  donorInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCheckoutSchema.parse(body)

    const { orgSlug, formSlug, amount, isRecurring, donorInfo } = validatedData

    // Get organization by slug
    const supabase = await createClient()
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get donation form
    const { data: form, error: formError } = await supabase
      .from('donation_forms')
      .select('id, name')
      .eq('organization_id', org.id)
      .eq('slug', formSlug)
      .eq('is_active', true)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Donation form not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let customerId: string
    const existingCustomer = await getCustomerByEmail(donorInfo.email)

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const customer = await createCustomer({
        email: donorInfo.email,
        name: `${donorInfo.firstName} ${donorInfo.lastName}`,
        metadata: {
          organization_id: org.id,
          form_id: form.id,
        },
      })
      customerId = customer.id
    }

    let clientSecret: string

    if (isRecurring) {
      // Create recurring subscription
      const price = await createPrice({
        amount,
        interval: 'month',
        productName: `${org.name} - ${form.name}`,
      })

      const subscription = await createSubscription({
        customerId,
        priceId: price.id,
        metadata: {
          organization_id: org.id,
          donation_form_id: form.id,
          donor_first_name: donorInfo.firstName,
          donor_last_name: donorInfo.lastName,
        },
      })

      // Get the latest invoice's payment intent
      if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
        const invoice = subscription.latest_invoice
        if (invoice.payment_intent && typeof invoice.payment_intent !== 'string') {
          clientSecret = invoice.payment_intent.client_secret || ''
        } else {
          throw new Error('No payment intent found for subscription')
        }
      } else {
        throw new Error('No invoice found for subscription')
      }

      // Create donation record in database
      await supabase.from('donations').insert({
        organization_id: org.id,
        donation_form_id: form.id,
        amount: Math.round(amount * 100), // Store in cents
        currency: 'usd',
        status: 'pending',
        is_recurring: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        donor_email: donorInfo.email,
        donor_name: `${donorInfo.firstName} ${donorInfo.lastName}`,
        donor_phone: donorInfo.phone || null,
      })
    } else {
      // Create one-time payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        customerEmail: donorInfo.email,
        metadata: {
          organization_id: org.id,
          donation_form_id: form.id,
          donor_first_name: donorInfo.firstName,
          donor_last_name: donorInfo.lastName,
          donor_phone: donorInfo.phone || '',
        },
      })

      clientSecret = paymentIntent.client_secret || ''

      // Create donation record in database
      await supabase.from('donations').insert({
        organization_id: org.id,
        donation_form_id: form.id,
        amount: Math.round(amount * 100), // Store in cents
        currency: 'usd',
        status: 'pending',
        is_recurring: false,
        stripe_customer_id: customerId,
        stripe_payment_intent_id: paymentIntent.id,
        donor_email: donorInfo.email,
        donor_name: `${donorInfo.firstName} ${donorInfo.lastName}`,
        donor_phone: donorInfo.phone || null,
      })
    }

    return NextResponse.json({
      clientSecret,
      customerId,
    })
  } catch (error) {
    console.error('Create checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
