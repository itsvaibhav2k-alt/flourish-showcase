# Inngest Background Jobs

This directory contains all Inngest background job functions for Flourish.

## Overview

Inngest provides reliable background job processing with automatic retries, step-based execution, and built-in observability.

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

### 2. Install Dependencies

The following dependencies are required and already included in package.json:
- `inngest` - Inngest SDK
- `resend` - Email sending
- `@anthropic-ai/sdk` - Claude AI for email generation
- `@react-email/components` - Email templates (needs to be installed)

Install missing dependencies:

```bash
npm install @react-email/components @react-email/render
```

### 3. Local Development

Start the Inngest dev server:

```bash
npx inngest-cli@latest dev
```

Then start your Next.js app:

```bash
npm run dev
```

The Inngest dev server will connect to your app at `http://localhost:3000/api/inngest`.

## Functions

### 1. Generate Thank You Email (`generate-thank-you.ts`)

**Trigger:** `gift/created` event

**What it does:**
1. Fetches gift and contact details
2. Retrieves organization voice profile
3. Uses Claude AI to generate personalized thank-you email
4. Saves draft to `email_drafts` table with status 'draft'
5. Logs activity

**Example usage:**
```typescript
await inngest.send({
  name: 'gift/created',
  data: {
    giftId: 'uuid',
    contactId: 'uuid',
    organizationId: 'uuid',
    amount: 100.00
  }
})
```

### 2. Send Approved Emails (`send-approved-emails.ts`)

**Trigger:** Cron schedule (every 5 minutes)

**What it does:**
1. Queries `email_drafts` where status = 'reviewed' and sent_at is null
2. Sends each email via Resend
3. Updates status to 'sent' and sets sent_at timestamp
4. Logs activities for sent emails

**Batch size:** 50 emails per run

### 3. Calculate Lapse Risk (`calculate-lapse-risk.ts`)

**Trigger:** Cron schedule (daily at 6 AM)

**What it does:**
1. Gets all organizations
2. For each org, fetches all donors
3. Calculates lapse risk based on:
   - Days since last gift
   - Average gift interval (for established donors)
   - Total number of gifts
4. Updates `contact.lapse_risk` field

**Lapse risk levels:**
- **Low:** Within normal giving pattern
- **Medium:** Moderately overdue (1.5-2.5x average interval)
- **High:** Significantly overdue (>2.5x average interval)

### 4. Send Volunteer Reminders (`send-volunteer-reminders.ts`)

**Trigger:** Cron schedule (daily at 8 AM)

**What it does:**
1. Finds shifts in next 7 days, tomorrow, or today
2. Checks which reminders haven't been sent yet
3. Generates and sends reminder emails via Resend
4. Updates reminder flags on shift_signups table

**Reminder types:**
- **7-day reminder:** Sent 7 days before shift (uses `confirmation_sent` flag)
- **1-day reminder:** Sent 1 day before shift (uses `reminder_1_sent` flag)
- **Morning reminder:** Sent day-of shift (uses `reminder_2_sent` flag)

**Auto-send:** These emails are auto-approved and sent directly (no draft review required).

### 5. Update Contact Stats (`update-contact-stats.ts`)

**Trigger:** `gift/created` event

**What it does:**
1. Recalculates lifetime_giving, total_gifts, last_gift_date
2. Recalculates volunteer hours and reliability score
3. Updates contact record
4. Logs activity

**Note:** Database triggers also handle some of this, but this job ensures consistency.

## Event Schemas

All events are type-safe and defined in `client.ts`:

```typescript
type Events = {
  'gift/created': {
    data: {
      giftId: string
      contactId: string
      organizationId: string
      amount: number
    }
  }
  'gift/thankyou.generate': {
    data: {
      giftId: string
      contactId: string
      organizationId: string
    }
  }
  'donor/lapse-risk.calculate': {
    data: {
      organizationId: string
    }
  }
  'volunteer/shift.reminder': {
    data: {
      signupId: string
      shiftId: string
      reminderType: '7day' | '1day' | 'morning'
    }
  }
  'email/send': {
    data: {
      emailId: string
    }
  }
  'email/batch-send': {
    data: {
      emailIds: string[]
    }
  }
}
```

## Sending Events

To trigger background jobs from your application code:

```typescript
import { inngest } from '@/lib/inngest/client'

// Send an event
await inngest.send({
  name: 'gift/created',
  data: {
    giftId: gift.id,
    contactId: gift.contact_id,
    organizationId: gift.organization_id,
    amount: gift.amount
  }
})
```

## Monitoring

### Local Development
Visit the Inngest dev server UI at `http://localhost:8288` to:
- View all function runs
- See step-by-step execution
- Debug failures
- Replay events

### Production
Use the Inngest Cloud dashboard at https://www.inngest.com/dashboard to:
- Monitor function execution
- View metrics and analytics
- Set up alerts
- Debug production issues

## Error Handling

All functions use Inngest's step-based execution for reliability:
- Each step is automatically retried on failure
- Failed steps don't re-execute successful previous steps
- Errors are logged and visible in the Inngest dashboard

## Testing

To test functions locally:

1. Start the Inngest dev server
2. Start your Next.js app
3. Send test events via the Inngest dev UI or your app code
4. View execution in the Inngest dev UI

Example test event:
```typescript
// In your test file or console
await inngest.send({
  name: 'gift/created',
  data: {
    giftId: 'test-gift-id',
    contactId: 'test-contact-id',
    organizationId: 'test-org-id',
    amount: 50.00
  }
})
```

## Architecture

```
src/lib/inngest/
├── client.ts                    # Inngest client and event schemas
├── functions/
│   ├── index.ts                # Export all functions
│   ├── generate-thank-you.ts   # Thank-you email generation
│   ├── send-approved-emails.ts # Email sending
│   ├── calculate-lapse-risk.ts # Lapse risk calculation
│   ├── send-volunteer-reminders.ts # Volunteer reminders
│   └── update-contact-stats.ts # Contact stats updates
└── README.md                   # This file

src/app/api/inngest/
└── route.ts                    # Next.js API route handler

src/lib/email/
├── resend.ts                   # Resend client
└── templates/
    ├── thank-you.tsx          # Thank-you email template
    └── volunteer-reminder.tsx # Volunteer reminder template
```

## Best Practices

1. **Use steps for all async operations** - Each step is automatically retried
2. **Keep functions focused** - Each function should do one thing well
3. **Log important events** - Use `console.log` for debugging (visible in Inngest UI)
4. **Handle errors gracefully** - Throw errors for retryable failures, return for non-retryable ones
5. **Use type-safe events** - Always use the typed event schemas
6. **Test locally first** - Use the Inngest dev server before deploying

## Troubleshooting

### Function not running
- Check that the Inngest dev server is running
- Verify the API route is accessible at `/api/inngest`
- Check for errors in the Inngest dev UI

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check that `RESEND_FROM_EMAIL` is verified in Resend
- Look for errors in function logs

### AI generation failing
- Verify `ANTHROPIC_API_KEY` is set
- Check for API errors in function logs
- Verify the organization has a voice profile

## Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest TypeScript SDK](https://www.inngest.com/docs/reference/typescript)
- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
