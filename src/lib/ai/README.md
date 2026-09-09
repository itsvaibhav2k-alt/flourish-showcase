# Flourish AI Communication Engine

Complete AI-powered email generation system using Claude AI with voice training, prompt caching, and cost tracking.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   AI Communication Engine                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Voice        │  │ Context      │  │ Prompt       │     │
│  │ Training     │─→│ Building     │─→│ Generation   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ↓                  ↓                  ↓             │
│  ┌──────────────────────────────────────────────────┐     │
│  │            Claude API (with caching)              │     │
│  └──────────────────────────────────────────────────┘     │
│         │                                                   │
│         ↓                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Draft        │─→│ Approval     │─→│ Sending      │     │
│  │ Creation     │  │ Workflow     │  │ (Resend)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ↓                  ↓                  ↓             │
│  ┌──────────────────────────────────────────────────┐     │
│  │        Cost Tracking & Analytics                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Claude API Integration (`claude.ts`)

Main interface to Claude API with prompt caching support.

```typescript
import { generateWithCaching, analyzeVoiceSamples, MODELS } from '@/lib/ai/claude'

// Generate email with caching
const response = await generateWithCaching({
  systemPrompt: 'Your system prompt...',
  userPrompt: 'Generate an email for...',
  model: MODELS.HAIKU, // or MODELS.SONNET
  maxTokens: 1024,
})

// Analyze voice samples
const voiceProfile = await analyzeVoiceSamples([
  'Sample email 1...',
  'Sample email 2...',
  // ... 5-10 samples
])
```

**Models:**
- **Haiku** (`claude-3-5-haiku-20241022`): Cost-effective, fast, for most emails
- **Sonnet** (`claude-3-5-sonnet-20241022`): Higher quality, for major donors

**Prompt Caching:**
- System prompts are cached for 5 minutes
- Reduces costs by ~90% for repeated prompts
- Automatic cache management

### 2. Context Building (`context/builder.ts`)

Assembles donor and volunteer context from database.

```typescript
import { buildDonorContext, buildVolunteerContext } from '@/lib/ai/context/builder'

// Get comprehensive donor data
const donorContext = await buildDonorContext(contactId)
// Includes: giving history, relationship metrics, recent interactions

// Get volunteer data
const volunteerContext = await buildVolunteerContext(contactId, shiftId)
// Includes: volunteer history, current shift details
```

**Context Includes:**
- Personal information
- Giving/volunteering history
- Relationship metrics (engagement score, segments)
- Recent interactions
- Relevant tags and notes

### 3. Prompt Engineering (`prompts/`)

Specialized prompts for each email type:

- **`thank-you.ts`**: Donor thank-you emails
- **`reengagement.ts`**: Lapsed donor re-engagement
- **`volunteer.ts`**: Volunteer confirmations, reminders, thank-yous
- **`voice-analysis.ts`**: Voice training and style extraction

Each prompt includes:
- Voice profile integration
- Context serialization
- Personalization rules
- Length and tone guidelines
- Critical do's and don'ts

### 4. Server Actions (`/modules/communications/actions/`)

#### Voice Training

```typescript
import { trainVoice } from '@/modules/communications/actions'

const result = await trainVoice({
  organizationId: 'uuid',
  emailSamples: ['email 1', 'email 2', ...], // 5-10 samples
})

if (result.success) {
  console.log('Voice profile:', result.voiceProfile)
}
```

#### Generate Draft

```typescript
import { generateDraft } from '@/modules/communications/actions'

const result = await generateDraft({
  organizationId: 'uuid',
  contactId: 'uuid',
  emailType: 'thank_you',
  context: {
    giftId: 'uuid',
  },
  useSonnet: false, // true for major donors
})

if (result.success) {
  console.log('Draft ID:', result.draftId)
  console.log('Subject:', result.subject)
  console.log('Body:', result.body)
}
```

#### Approve/Reject Draft

```typescript
import { approveDraft } from '@/modules/communications/actions'

const result = await approveDraft({
  draftId: 'uuid',
  approved: true,
  editedSubject: 'Edited subject', // optional
  editedBody: 'Edited body', // optional
})
```

#### Send Email

```typescript
import { sendEmail } from '@/modules/communications/actions'

const result = await sendEmail({
  draftId: 'uuid',
  fromName: 'John Doe',
  fromEmail: 'john@example.com',
  replyTo: 'support@example.com',
})
```

### 5. Cost Tracking (`cost-tracker.ts`)

Monitor AI usage and costs:

```typescript
import { getMonthlyUsage, checkUsageLimit } from '@/lib/ai/cost-tracker'

// Get monthly stats
const usage = await getMonthlyUsage(organizationId)
console.log('Cost:', usage.estimatedCost)
console.log('Tokens:', usage.totalTokens)
console.log('Emails:', usage.emailCount)

// Check limits
const limit = await checkUsageLimit(organizationId, 100) // $100/month
if (!limit.withinLimit) {
  console.warn('Usage limit exceeded!')
}
```

**Pricing** (as of Nov 2024):

| Model | Input | Output | Cache Write | Cache Read |
|-------|--------|--------|-------------|------------|
| Haiku | $1/1M | $5/1M | $1.25/1M | $0.10/1M |
| Sonnet | $3/1M | $15/1M | $3.75/1M | $0.30/1M |

### 6. Fallback Templates (`fallback.ts`)

Ensures communications continue even if AI fails:

```typescript
import { getFallbackTemplate, shouldUseFallback } from '@/lib/ai/fallback'

try {
  // Try AI generation
  const result = await generateWithClaude(...)
} catch (error) {
  if (shouldUseFallback(error)) {
    // Use fallback template
    const template = getFallbackTemplate('thank_you', {
      firstName: 'John',
      amount: '$100',
      organizationName: 'Our Charity',
    })
  }
}
```

## Email Types

### Donor Communications

1. **Thank You** (`thank_you`)
   - Triggered: After gift is recorded
   - Context: Gift details, donor history
   - Model: Sonnet for $1000+, Haiku otherwise
   - Length: 75-250 words based on gift size

2. **Re-engagement** (`reengagement`)
   - Triggered: Manual or automated for lapsed donors
   - Context: Past giving, months since last gift
   - Model: Haiku
   - Length: 125-175 words

### Volunteer Communications

3. **Confirmation** (`volunteer_confirmation`)
   - Triggered: After shift signup
   - Context: Shift details, volunteer history
   - Model: Haiku
   - Length: 100-150 words

4. **Reminder** (`volunteer_reminder`)
   - Types: 7-day, 1-day, morning-of
   - Model: Haiku
   - Length: 40-100 words based on timing

5. **Thank You** (`volunteer_thank_you`)
   - Triggered: After shift completion
   - Context: Hours worked, volunteer history
   - Model: Haiku
   - Length: 100-150 words

## Database Schema

### Voice Profile (on `organizations` table)

```sql
voice_summary TEXT
voice_formality VARCHAR(20) -- casual, moderate, formal
voice_warmth INTEGER -- 1-10
voice_signature_phrases TEXT[]
voice_greeting_style TEXT
voice_closing_style TEXT
voice_tone_characteristics TEXT[]
voice_trained_at TIMESTAMPTZ
voice_trained_by UUID
```

### Email Drafts

```sql
CREATE TABLE email_drafts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending, approved, rejected, sent
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  was_edited BOOLEAN,
  sent_at TIMESTAMPTZ,
  sent_by UUID,
  resend_id TEXT,
  generated_by VARCHAR(20), -- claude, fallback
  gift_id UUID,
  shift_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
)
```

### AI Usage

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_creation_tokens INTEGER,
  cache_read_tokens INTEGER,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  email_type VARCHAR(50),
  contact_id UUID,
  draft_id UUID,
  created_at TIMESTAMPTZ NOT NULL
)
```

## Usage Workflow

### 1. Train Organizational Voice (One-Time Setup)

```typescript
// Collect 5-10 sample emails that represent your organization's voice
const samples = [
  'Dear Sarah, Thank you so much for...',
  'Hi Michael, We are thrilled...',
  // ... more samples
]

// Train voice
const result = await trainVoice({
  organizationId: org.id,
  emailSamples: samples,
})

// Voice profile is now saved and will be used for all future emails
```

### 2. Generate Email Draft

```typescript
// When a gift is recorded, generate thank-you
const draft = await generateDraft({
  organizationId: org.id,
  contactId: donor.id,
  emailType: 'thank_you',
  context: {
    giftId: gift.id,
  },
})

// Draft is created with status 'pending'
```

### 3. Review and Approve

```typescript
// View draft in UI
const draft = await getDraft(draftId)

// Approve (with optional edits)
await approveDraft({
  draftId: draft.id,
  approved: true,
  editedSubject: 'Custom subject', // optional
})

// Or reject with reason
await approveDraft({
  draftId: draft.id,
  approved: false,
  rejectionReason: 'Needs more personalization',
})
```

### 4. Send Email

```typescript
// Send approved draft
const result = await sendEmail({
  draftId: draft.id,
  fromName: 'Jane Smith',
  fromEmail: 'jane@charity.org',
  replyTo: 'info@charity.org',
})

// Email is sent via Resend
// Draft status updated to 'sent'
// Activity logged to interactions
// Gift marked as thanked
```

## Best Practices

### Voice Training

1. **Quality Samples**: Use 5-10 real emails that best represent your voice
2. **Variety**: Include different types (thank-yous, updates, invitations)
3. **Consistency**: Samples should be consistent in tone and style
4. **Length**: Each sample should be at least 50 characters
5. **Re-train**: Update voice profile as your communication style evolves

### Draft Generation

1. **Context is Key**: Ensure donor/volunteer data is up-to-date
2. **Model Selection**: Use Sonnet for major donors, Haiku for others
3. **Batch Generation**: Generate multiple drafts at once for efficiency
4. **Review Process**: Always review before sending

### Cost Management

1. **Monitor Usage**: Check monthly costs regularly
2. **Set Limits**: Implement spending limits per organization
3. **Optimize**: Use Haiku by default, Sonnet only when needed
4. **Caching**: System prompts are automatically cached (90% savings)
5. **Fallbacks**: Ensure fallback templates are configured

### Error Handling

1. **Graceful Degradation**: Use fallback templates when AI fails
2. **Logging**: Track fallback usage for monitoring
3. **Retry Logic**: Implement for transient failures
4. **User Feedback**: Show clear error messages

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_DOMAIN=yourdomain.com

# Optional
AI_MONTHLY_LIMIT=100 # Default spending limit in USD
```

## Testing

```typescript
// Test voice analysis
const analysis = await analyzeVoiceSamples(testSamples)
expect(analysis.formality).toBeOneOf(['casual', 'moderate', 'formal'])
expect(analysis.warmth).toBeGreaterThanOrEqual(1)
expect(analysis.warmth).toBeLessThanOrEqual(10)

// Test draft generation
const draft = await generateDraft({...})
expect(draft.success).toBe(true)
expect(draft.subject).toBeTruthy()
expect(draft.body).toBeTruthy()

// Test fallback
const template = getFallbackTemplate('thank_you', vars)
expect(template.subject).toContain('Thank you')
```

## Monitoring

### Key Metrics to Track

1. **Generation Success Rate**: % of successful AI generations
2. **Fallback Usage**: How often fallbacks are used
3. **Cost per Email**: Average cost by type
4. **Approval Rate**: % of drafts approved vs rejected
5. **Send Rate**: % of approved drafts actually sent
6. **Response Time**: Time from generation to sending

### Alerts to Set Up

1. Monthly spending approaching limit
2. High fallback usage rate (indicates API issues)
3. Low approval rate (indicates quality issues)
4. API errors or timeouts

## Future Enhancements

- [ ] A/B testing different prompts
- [ ] Sentiment analysis of generated emails
- [ ] Predictive send time optimization
- [ ] Multi-language support
- [ ] Image generation for email headers
- [ ] Custom voice profiles per email type
- [ ] Automated re-engagement campaigns
- [ ] Impact prediction (likelihood to donate/volunteer)

## Support

For issues or questions:
1. Check error logs in Supabase
2. Review AI usage metrics
3. Verify voice profile is trained
4. Test with fallback templates
5. Check API key validity

## License

Proprietary - Part of Flourish Nonprofit CRM
