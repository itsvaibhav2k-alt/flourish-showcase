# Stripe Integration

Complete Stripe integration for processing online donations in Flourish CRM.

## Features

- ✅ One-time donations via Payment Intents
- ✅ Recurring donations via Subscriptions
- ✅ Webhook event handling
- ✅ Automatic contact creation for new donors
- ✅ Gift recording in database
- ✅ Receipt email sending
- ✅ Thank-you email generation via Inngest
- ✅ Activity logging

## Setup

### 1. Install Dependencies

```bash
npm install stripe
```

### 2. Environment Variables

Add the following to your `.env.local`:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Required for production webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint pointing to: `https://yourdomain.com/api/stripe/webhook`
3. Select the following events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret and add it to your `.env.local`

### 4. Test Webhooks Locally

Use the Stripe CLI to forward webhooks to your local development server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will output a webhook signing secret that you can use for local testing.

## Usage

### Creating a Payment Intent (One-time Donation)

```typescript
import { createPaymentIntent } from '@/lib/stripe'

const paymentIntent = await createPaymentIntent({
  amount: 100, // $100.00
  currency: 'usd',
  customerEmail: 'donor@example.com',
  metadata: {
    organizationId: 'org_123',
    contactId: 'contact_456', // Optional, will be created if not provided
    campaign: 'Annual Fund',
    giftType: 'online',
  },
})

// Send paymentIntent.client_secret to frontend
```

### Creating a Recurring Donation

```typescript
import { createCustomer, createPrice, createSubscription } from '@/lib/stripe'

// 1. Create or get customer
const customer = await createCustomer({
  email: 'donor@example.com',
  name: 'John Doe',
  metadata: {
    organizationId: 'org_123',
    contactId: 'contact_456',
  },
})

// 2. Create a price for the recurring amount
const price = await createPrice({
  amount: 50, // $50/month
  interval: 'month',
  productName: 'Monthly Donation',
})

// 3. Create subscription
const subscription = await createSubscription({
  customerId: customer.id,
  priceId: price.id,
  metadata: {
    organizationId: 'org_123',
    contactId: 'contact_456',
    donationType: 'recurring',
  },
})
```

### Webhook Flow

When a payment succeeds, the webhook handler automatically:

1. **Verifies** the webhook signature for security
2. **Finds or creates** a contact record
   - Searches by email if no contact ID provided
   - Creates new contact with "online-donor" tag if needed
3. **Records the gift** in the database
   - Links to contact and organization
   - Stores Stripe payment ID in notes
4. **Updates contact** to mark as donor
5. **Logs activity** in timeline
6. **Triggers Inngest event** for AI-generated thank-you email
7. **Sends receipt email** via Resend

## API Reference

### Client Functions

#### `createPaymentIntent(params)`
Create a payment intent for one-time donations.

```typescript
const paymentIntent = await createPaymentIntent({
  amount: 100,
  currency: 'usd',
  customerEmail: 'donor@example.com',
  metadata: {
    organizationId: 'org_123',
    contactId: 'contact_456',
  },
})
```

#### `createCustomer(params)`
Create a Stripe customer.

```typescript
const customer = await createCustomer({
  email: 'donor@example.com',
  name: 'John Doe',
  metadata: { organizationId: 'org_123' },
})
```

#### `createSubscription(params)`
Create a subscription for recurring donations.

```typescript
const subscription = await createSubscription({
  customerId: 'cus_123',
  priceId: 'price_123',
  metadata: { organizationId: 'org_123' },
})
```

#### `cancelSubscription(subscriptionId)`
Cancel a recurring donation subscription.

```typescript
await cancelSubscription('sub_123')
```

### Helper Functions

#### `formatAmount(cents)` / `formatAmountToCents(dollars)`
Convert between cents and dollars.

```typescript
formatAmount(10000) // 100
formatAmountToCents(100) // 10000
```

#### `formatCurrency(amount, currency)`
Format amount as currency string.

```typescript
formatCurrency(100, 'USD') // "$100.00"
```

#### `getCustomerByEmail(email)`
Find a Stripe customer by email.

```typescript
const customer = await getCustomerByEmail('donor@example.com')
```

#### `refundPayment(paymentIntentId, amount?, reason?)`
Process a refund.

```typescript
await refundPayment('pi_123', 50, 'requested_by_customer')
```

## Database Schema

The webhook handler creates records in the following tables:

### `gifts`
- `organization_id` - Organization ID
- `contact_id` - Contact ID (found or created)
- `amount` - Donation amount in dollars
- `gift_date` - Date of donation
- `gift_type` - Type (e.g., "online")
- `campaign` - Campaign name
- `payment_method` - "stripe"
- `notes` - Includes Stripe payment ID

### `contacts`
- Auto-created if needed with:
  - `email` from payment
  - `first_name` / `last_name` from metadata or defaults
  - `is_donor` set to `true`
  - `tags` includes "online-donor"

### `activities`
- Activity log entries for gift recording
- Activity log entries for contact creation/updates

## Testing

### Test Cards

Use Stripe's test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Test Webhooks

```bash
# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Security

- ✅ Webhook signature verification prevents unauthorized requests
- ✅ All database operations use admin client with proper authorization checks
- ✅ Environment variables for sensitive keys
- ✅ Idempotency checks prevent duplicate gift records
- ✅ Error handling and logging throughout

## Troubleshooting

### Webhook not receiving events
- Check webhook endpoint URL in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check server logs for signature verification errors

### Payment succeeds but no gift recorded
- Check server logs for errors
- Verify `organizationId` is in payment metadata
- Ensure webhook endpoint is receiving events

### Duplicate gift records
- The webhook handler includes idempotency checks based on payment ID
- If duplicates occur, check for multiple webhook deliveries in Stripe logs

## Next Steps

- Add frontend payment form with Stripe Elements
- Create donation page with amount selection
- Build recurring donation management UI
- Add donation analytics dashboard
- Implement donation receipts with tax information
- Add support for other payment methods (ACH, etc.)
