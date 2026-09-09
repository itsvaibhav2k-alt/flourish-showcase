# Impact Stories Module

The Impact Stories module enables nonprofits to create personalized, AI-generated impact narratives that show donors the tangible difference their giving makes. Stories are shareable via public links with beautiful social media previews.

## Features

- **Impact Metrics Management**: Define organization-level metrics (e.g., meals served, students tutored) with cost-per-unit calculations
- **AI Story Generation**: Claude-powered narrative generation that weaves impact numbers into compelling stories
- **Shareable Public Links**: Each story gets a unique, public URL with no authentication required
- **Social Media Integration**: Full OG meta tags for rich social sharing
- **Email Distribution**: Send stories directly to donors via email
- **View Tracking**: Monitor story engagement with view counts

## Architecture

### Database Schema

**impact_metrics** table:
- Stores organization-level metrics (e.g., meals_served, students_tutored)
- Defines cost per unit for impact calculations
- Configurable unit labels (singular/plural) and icons
- Display order and active/inactive status

**impact_stories** table:
- Stores generated impact narratives
- Links to contacts and organizations
- Contains AI-generated title and content
- Metrics object (JSONB) with calculated impact
- Unique share token for public access
- Tracking fields (sent_at, opened_at, view_count)

### Module Structure

```
/src/modules/impact-stories/
├── actions/               # Server actions (mutations)
│   ├── create-metric.ts
│   ├── update-metric.ts
│   ├── delete-metric.ts
│   ├── generate-story.ts  # AI story generation
│   └── send-story.ts      # Email distribution
├── queries/               # Data fetching
│   ├── get-metrics.ts
│   ├── get-stories.ts
│   └── get-story-by-token.ts  # Public access (no auth)
├── services/             # Business logic
│   └── generate-story.ts  # AI integration & calculations
├── schemas/              # Zod validation
│   └── index.ts
└── components/           # React components
    ├── metrics-manager.tsx      # CRUD UI for metrics
    ├── story-generator.tsx      # Story generation dialog
    ├── story-card.tsx           # Story display with actions
    └── public-story-view.tsx    # Public shareable view
```

### Pages

1. **Dashboard**: `/flora/impact-stories`
   - Manage impact metrics
   - View all generated stories
   - Requires authentication

2. **Public Story**: `/impact/[token]`
   - Shareable public view (no auth)
   - Full OG meta tags for social sharing
   - Beautiful gradient design with impact metrics display

## Usage

### 1. Set Up Impact Metrics

Navigate to `/flora/impact-stories` and create your organization's impact metrics:

```typescript
{
  metric_name: 'meals_served',
  description: 'Meals provided to families in need',
  cost_per_unit: 2.50,
  unit_label: 'meal',
  unit_label_plural: 'meals',
  icon: 'utensils',  // Lucide icon name
  is_active: true
}
```

### 2. Generate Stories

From any contact's profile, use the Story Generator:

```typescript
import { StoryGenerator } from '@/modules/impact-stories'

<StoryGenerator
  organizationId={orgId}
  contactId={contactId}
  contactName="John Doe"
/>
```

The AI will:
1. Calculate donor's total giving (for specified period or all-time)
2. Compute impact metrics based on cost-per-unit
3. Generate a personalized narrative weaving in specific numbers
4. Create a shareable public link

### 3. Share Stories

Each story receives a unique token and public URL:
```
https://yourorg.com/impact/abc123def456
```

Send via email or share on social media. Full OG meta tags ensure rich previews.

## AI Story Generation

The story generation service uses Claude Haiku 4.5 for cost-effective generation:

1. **Context Building**:
   - Donor name and giving history
   - Calculated impact metrics (units impacted)
   - Time period (specific dates or all-time)

2. **Prompt Engineering**:
   - System prompt defines storytelling approach (narrative-driven, not data-driven)
   - User prompt provides specific donor context and metrics
   - Temperature: 1.0 for creative, varied output

3. **Output Parsing**:
   - Extracts title (headline) and content
   - Validates and stores metrics object
   - Generates unique share token

### Example Generated Story

**Title**: "You Changed 250 Lives This Year"

**Content**:
> "When you gave $625 to our food bank this year, you did more than make a donation—you changed lives. Your generosity put 250 nutritious meals on the tables of families facing hunger in our community.
>
> Each meal represented a child who didn't go to bed hungry, a parent who could breathe easier knowing their family would eat, and a senior who gained the dignity of a warm dinner.
>
> Your impact rippled through our neighborhood, creating moments of relief and hope for 62 families. Thank you for being the kind of person who turns compassion into action."

## API Reference

### Server Actions

**generateStory(organizationId, data)**
- Generates AI-powered impact story for a donor
- Calculates metrics based on giving and org metrics
- Returns story ID, title, content, and share URL

**sendStory(data)**
- Emails story to donor
- Updates sent_at timestamp
- Uses Resend for delivery

**createMetric(organizationId, data)**
- Creates new impact metric
- Validates input with Zod schema

### Queries

**getMetrics(params)**
- Fetches org metrics (active or all)
- Ordered by display_order

**getStories(params)**
- Fetches stories for org/contact
- Includes contact details via join
- Supports pagination

**getStoryByToken(token)**
- Public query (no auth required)
- Returns story with org/contact info
- Used for public share links

## Security

- **RLS Policies**: All queries respect Row Level Security
- **Public Access**: Stories with valid share_token and is_public=true are accessible
- **Admin Client**: Public queries use admin client to bypass RLS for specific public access
- **Token Generation**: Cryptographically secure random tokens (16 bytes, hex encoded)

## Performance

- **AI Caching**: System prompts use Claude prompt caching for cost savings
- **Cost Tracking**: All AI usage logged to ai_usage table
- **Model Selection**: Uses Haiku 4.5 for optimal cost/quality balance
- **Token Estimation**: Approximate token counts for usage tracking

## Migration

Run the migration to create tables:

```bash
npx supabase db reset  # Development
# OR
npx supabase migration up  # Production
```

Migration file: `supabase/migrations/033_impact_stories.sql`

## Integration Points

### Contact Pages
Add the Story Generator to contact detail pages:

```typescript
import { StoryGenerator } from '@/modules/impact-stories'

// In contact detail page
<StoryGenerator
  organizationId={contact.organization_id}
  contactId={contact.id}
  contactName={`${contact.first_name} ${contact.last_name}`}
/>
```

### Dashboard Widgets
Display recent stories or metrics:

```typescript
import { getStories } from '@/modules/impact-stories'

const { stories } = await getStories({
  organizationId,
  limit: 5
})
```

## Future Enhancements

Potential improvements:
- [ ] PDF export of stories
- [ ] Custom OG image generation
- [ ] Story templates/themes
- [ ] Batch story generation
- [ ] Impact reports (aggregate metrics across donors)
- [ ] Scheduled story sending (anniversaries, year-end)
- [ ] A/B testing for story formats
- [ ] Multi-language support

## Troubleshooting

**No metrics error**: Ensure at least one active metric exists before generating stories

**Zero impact calculated**: Check that donor has gifts in the specified period and metrics have appropriate cost_per_unit values

**Public page 404**: Verify story has is_public=true and valid share_token

**Email not sending**: Check RESEND_API_KEY environment variable and contact email validity
