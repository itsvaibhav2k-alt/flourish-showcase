'use server'

import { createClient } from '@/lib/supabase/server'
import { getStripeClientForOrg } from '@/lib/stripe/client'
import { processDonationSchema, type ProcessDonationInput } from '../schemas/donation.schema'

type ProcessDonationResult = {
  success: boolean
  data?: {
    clientSecret: string
    donationId: string
  }
  error?: string
}

/**
 * Server action to process a donation
 * Creates a Stripe payment intent and records the pending donation
 */
export async function processDonation(
  organizationSlug: string,
  input: ProcessDonationInput
): Promise<ProcessDonationResult> {
  try {
    // Validate input
    const validatedData = processDonationSchema.parse(input)

    // Get organization by slug
    const supabase = await createClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, stripe_account_id, stripe_publishable_key')
      .eq('slug', organizationSlug)
      .single()

    if (orgError || !org) {
      return {
        success: false,
        error: 'Organization not found',
      }
    }

    // Get donation form if provided
    let donationFormId: string | null = null
    if (validatedData.donation_form_slug) {
      const { data: form, error: formError } = await supabase
        .from('donation_forms')
        .select('id, is_active')
        .eq('organization_id', org.id)
        .eq('slug', validatedData.donation_form_slug)
        .single()

      if (formError || !form || !form.is_active) {
        return {
          success: false,
          error: 'Donation form not found or inactive',
        }
      }

      donationFormId = form.id
    }

    // Check if contact exists with this email
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', org.id)
      .eq('email', validatedData.donor_email)
      .single()

    let contactId: string | null = existingContact?.id || null

    // If contact doesn't exist and we have complete info, create one
    if (!contactId && validatedData.donor_email && validatedData.donor_first_name && validatedData.donor_last_name) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          first_name: validatedData.donor_first_name,
          last_name: validatedData.donor_last_name,
          email: validatedData.donor_email,
          phone: validatedData.donor_phone || null,
          address: validatedData.donor_address || null,
          is_donor: true,
        })
        .select('id')
        .single()

      contactId = newContact?.id || null
    }

    // Create pending donation record first
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        organization_id: org.id,
        donation_form_id: donationFormId,
        contact_id: contactId,
        amount: Math.round(validatedData.amount * 100), // Store in cents to match Stripe
        currency: 'usd',
        is_recurring: validatedData.frequency !== 'one-time',
        status: 'pending',
        donor_email: validatedData.donor_email,
        donor_name: `${validatedData.donor_first_name} ${validatedData.donor_last_name}`.trim(),
        donor_phone: validatedData.donor_phone || null,
        metadata: {
          donor_first_name: validatedData.donor_first_name,
          donor_last_name: validatedData.donor_last_name,
          donor_address: validatedData.donor_address || null,
          campaign: validatedData.campaign || null,
          custom_fields: validatedData.custom_fields || null,
          frequency: validatedData.frequency,
        },
      })
      .select('id')
      .single()

    if (donationError || !donation) {
      console.error('Error creating donation:', donationError)
      return {
        success: false,
        error: donationError?.message || 'Failed to create donation',
      }
    }

    // Create Stripe PaymentIntent
    try {
      const stripe = await getStripeClientForOrg(org.id)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validatedData.amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        receipt_email: validatedData.donor_email,
        metadata: {
          donation_id: donation.id,
          organization_id: org.id,
          donation_form_id: donationFormId || '',
          contact_id: contactId || '',
          donor_email: validatedData.donor_email,
          donor_name: `${validatedData.donor_first_name} ${validatedData.donor_last_name}`.trim(),
          is_recurring: validatedData.frequency !== 'one-time' ? 'true' : 'false',
          frequency: validatedData.frequency,
        },
      })

      // Update donation record with Stripe PaymentIntent ID
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('id', donation.id)

      if (updateError) {
        console.error('Error updating donation with payment intent:', updateError)
        // Don't fail the request - the payment intent was created successfully
        // The webhook will still be able to match by donation_id in metadata
      }

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret!,
          donationId: donation.id,
        },
      }
    } catch (stripeError) {
      console.error('Stripe error creating payment intent:', stripeError)

      // Mark donation as failed
      await supabase
        .from('donations')
        .update({ status: 'failed' })
        .eq('id', donation.id)

      return {
        success: false,
        error: stripeError instanceof Error ? stripeError.message : 'Failed to create payment intent',
      }
    }
  } catch (error) {
    console.error('Error in processDonation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process donation',
    }
  }
}
