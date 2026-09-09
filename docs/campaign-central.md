# Campaign Central Module

The Campaign Central module is a comprehensive fundraising campaign tracking system for Flourish. It allows nonprofit organizations to create campaigns, set goals, track progress, and link donations to specific campaigns.

## Features

### Campaign Management
- **Create Campaigns**: Set up fundraising campaigns with customizable goals and timelines
- **Campaign Types**: Support for multiple campaign types:
  - Fundraising (general)
  - Awareness campaigns
  - Event-based campaigns
  - Annual fund drives
  - Capital campaigns

### Progress Tracking
- **Real-time Statistics**: Track raised amount, donor count, and progress percentage
- **Visual Progress**: Interactive thermometer visualization showing campaign progress
- **Goal Monitoring**: Set monetary goals and track achievement
- **Timeline Tracking**: Monitor days remaining and identify overdue campaigns

### Gift Attribution
- **Link Gifts**: Associate donations with specific campaigns
- **Bulk Linking**: Link multiple gifts at once with date-based filtering
- **Donor Insights**: View complete list of donors and their contributions per campaign
- **Flexible Attribution**: Support for primary and soft-credit attributions

### Campaign Analytics
- **Dashboard Overview**: Summary cards showing active campaigns, total raised, and donor count
- **Campaign Cards**: Grid or list view with quick status indicators
- **Detailed View**: Comprehensive campaign page with donor list and gift history
- **Status Management**: Easy campaign status transitions (planning → active → completed)

## Database Schema

### Tables

#### `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'fundraising',
  goal_amount NUMERIC(12,2),
  raised_amount NUMERIC(12,2) DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  target_audience JSONB,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Status Values**: `planning`, `active`, `paused`, `completed`, `cancelled`

**Campaign Types**: `fundraising`, `awareness`, `event`, `annual`, `capital`

#### `campaign_gifts`
```sql
CREATE TABLE campaign_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, gift_id)
);
```

### Automatic Updates

The module includes database triggers that automatically:
- Update `raised_amount` when gifts are linked/unlinked
- Update `donor_count` based on unique donors
- Maintain `updated_at` timestamps

## Module Structure

```
src/modules/campaign-central/
├── actions/
│   └── index.ts              # Server actions (create, update, delete, link gifts)
├── components/
│   ├── campaign-card.tsx            # Campaign grid/list card
│   ├── campaign-central-page.tsx    # Main dashboard page
│   ├── campaign-detail-view.tsx     # Detailed campaign view
│   ├── campaign-form-modal.tsx      # Create/edit modal
│   ├── campaign-stats.tsx           # Statistics cards
│   ├── gift-attribution-modal.tsx   # Link gifts to campaign
│   └── progress-thermometer.tsx     # Visual progress indicator
├── queries/
│   └── index.ts              # Data fetching functions
├── schemas/
│   └── campaign.schema.ts    # Zod validation schemas
└── index.tsx                 # Module exports
```

## Usage

### Accessing Campaign Central

Campaign Central is available as an add-on page at `/addon/campaign-central`. It must be enabled in organization settings before use.

### Creating a Campaign

```typescript
import { createCampaign } from '@/modules/campaign-central'

const result = await createCampaign({
  name: "Year-End Giving Campaign",
  description: "Annual fundraising drive for general operations",
  campaignType: "annual",
  goalAmount: 50000,
  startDate: "2025-12-01",
  endDate: "2025-12-31"
})
```

### Linking Gifts to Campaigns

```typescript
import { linkGiftToCampaign } from '@/modules/campaign-central'

const result = await linkGiftToCampaign(
  "campaign-uuid",
  "gift-uuid"
)
```

### Bulk Linking

```typescript
import { bulkLinkGiftsToCampaign } from '@/modules/campaign-central'

const result = await bulkLinkGiftsToCampaign(
  "campaign-uuid",
  ["gift-uuid-1", "gift-uuid-2", "gift-uuid-3"]
)
```

### Fetching Campaign Data

```typescript
import { getCampaigns, getCampaignById, getCampaignGifts } from '@/modules/campaign-central'

// Get all campaigns
const campaigns = await getCampaigns()

// Get active campaigns only
const activeCampaigns = await getCampaigns({ status: 'active' })

// Get specific campaign
const campaign = await getCampaignById("campaign-uuid")

// Get campaign gifts
const gifts = await getCampaignGifts("campaign-uuid")
```

## Components

### CampaignCentralPage
Main dashboard component displaying all campaigns with filtering and search.

**Props:**
- `organizationId: string` - Current organization ID

### CampaignDetailView
Detailed view showing campaign statistics, progress, and donor list.

**Props:**
- `campaign: CampaignWithStats` - Campaign data with computed stats
- `onBack: () => void` - Callback when user navigates back

### CampaignFormModal
Modal for creating and editing campaigns.

**Props:**
- `open: boolean` - Modal visibility
- `onOpenChange: (open: boolean) => void` - Visibility change handler
- `campaign?: CampaignWithStats | null` - Campaign to edit (null for create)
- `onSuccess?: () => void` - Success callback

### GiftAttributionModal
Modal for linking gifts to a campaign with search and bulk selection.

**Props:**
- `campaignId: string` - Target campaign ID
- `campaignName: string` - Campaign name for display
- `open: boolean` - Modal visibility
- `onOpenChange: (open: boolean) => void` - Visibility change handler
- `onSuccess?: () => void` - Success callback

### ProgressThermometer
Visual thermometer showing campaign progress toward goal.

**Props:**
- `current: number` - Current amount raised
- `goal: number` - Goal amount
- `height?: number` - Thermometer height in pixels (default: 200)
- `className?: string` - Additional CSS classes

## Server Actions

### createCampaign
Create a new fundraising campaign.

**Input:**
```typescript
{
  name: string              // Required: Campaign name
  description?: string      // Optional: Campaign description
  campaignType: CampaignType // Default: 'fundraising'
  goalAmount?: number       // Optional: Fundraising goal
  startDate?: string        // Optional: ISO date string
  endDate?: string          // Optional: ISO date string
}
```

**Returns:** `ActionResult<{ id: string }>`

### updateCampaign
Update an existing campaign.

**Input:**
```typescript
{
  id: string                // Required: Campaign ID
  name?: string
  description?: string
  campaignType?: CampaignType
  goalAmount?: number | null
  status?: CampaignStatus
  startDate?: string | null
  endDate?: string | null
}
```

**Returns:** `ActionResult`

### deleteCampaign
Delete a campaign (also unlinks all gifts).

**Input:** `id: string`

**Returns:** `ActionResult`

### linkGiftToCampaign
Link a single gift to a campaign.

**Input:**
- `campaignId: string`
- `giftId: string`

**Returns:** `ActionResult`

### unlinkGiftFromCampaign
Remove gift attribution from a campaign.

**Input:**
- `campaignId: string`
- `giftId: string`

**Returns:** `ActionResult`

### bulkLinkGiftsToCampaign
Link multiple gifts to a campaign at once.

**Input:**
- `campaignId: string`
- `giftIds: string[]`

**Returns:** `ActionResult<{ linked: number; failed: number }>`

### updateCampaignStatus
Update only the campaign status.

**Input:**
- `id: string`
- `status: CampaignStatus`

**Returns:** `ActionResult`

## Queries

### getCampaigns
Fetch all campaigns for the current organization with computed statistics.

**Options:**
```typescript
{
  status?: CampaignStatus  // Filter by status
  limit?: number           // Limit results
}
```

**Returns:** `CampaignWithStats[]`

**CampaignWithStats includes:**
- All campaign fields
- `progressPercent: number` - Percentage toward goal (0-100)
- `daysRemaining: number | null` - Days until end date
- `isOverdue: boolean` - Whether campaign is past end date

### getCampaignById
Fetch a single campaign by ID.

**Input:** `id: string`

**Returns:** `CampaignWithStats | null`

### getCampaignStats
Get aggregate statistics for all campaigns.

**Returns:**
```typescript
{
  total: number        // Total campaigns
  active: number       // Active campaigns
  totalGoal: number    // Sum of active campaign goals
  totalRaised: number  // Sum of active campaign raised amounts
  totalDonors: number  // Sum of unique donors across active campaigns
}
```

### getCampaignGifts
Get all gifts linked to a specific campaign.

**Input:** `campaignId: string`

**Returns:**
```typescript
Array<{
  id: string
  amount: number
  giftDate: string
  donorName: string
  donorId: string
}>
```

### getAvailableGiftsForCampaign
Get gifts that can be linked to a campaign (filtered by date range).

**Input:**
```typescript
campaignId: string
options?: {
  startDate?: string  // Override campaign start date
  endDate?: string    // Override campaign end date
  limit?: number      // Limit results
}
```

**Returns:**
```typescript
Array<{
  id: string
  amount: number
  giftDate: string
  donorName: string
  donorId: string
  alreadyLinked: boolean
}>
```

## Best Practices

### Campaign Planning
1. **Set Realistic Goals**: Base goals on historical data and organizational capacity
2. **Define Clear Timelines**: Set start and end dates to create urgency
3. **Choose Appropriate Types**: Use campaign types to organize and filter campaigns
4. **Write Clear Descriptions**: Help team members understand campaign purpose

### Gift Attribution
1. **Link During Campaign Period**: Focus on gifts received during the campaign timeline
2. **Bulk Operations**: Use bulk linking for efficiency when attributing many gifts
3. **Regular Updates**: Keep attributions current for accurate progress tracking
4. **Review Before Linking**: Double-check gift dates align with campaign period

### Campaign Lifecycle
```
Planning → Active → Paused (if needed) → Completed
                 ↘ Cancelled (if necessary)
```

1. **Planning Phase**: Set up campaign details, goals, and timeline
2. **Active Phase**: Monitor progress, link gifts, engage donors
3. **Pause When Needed**: Temporarily suspend without losing data
4. **Complete Successfully**: Mark completed when goals are met or time expires
5. **Cancel if Necessary**: Cancel campaigns that are no longer viable

### Performance Optimization
- Campaign stats are computed on query, but cached by React components
- Database triggers automatically update `raised_amount` and `donor_count`
- Use pagination for campaigns lists when dealing with 100+ campaigns
- Bulk operations are significantly faster than individual links

## Integration Points

### With Donors Module
- Campaign Central integrates with the gifts table
- Links to donor profiles from campaign detail view
- Shared gift validation and processing

### With Communications Module
- Can trigger campaign-specific thank-you emails
- Segment donors by campaign participation
- Send campaign updates and progress reports

### With Reports Module
- Campaign performance metrics
- Donor retention by campaign
- ROI analysis and goal achievement rates

## Troubleshooting

### Gifts Not Appearing in Attribution Modal
- Check campaign date range includes gift dates
- Verify gifts belong to the same organization
- Ensure gifts aren't already linked to another campaign (if unique constraint)

### Progress Not Updating
- Verify database triggers are enabled
- Check RLS policies allow campaign updates
- Confirm gifts are successfully linked in `campaign_gifts` table

### Campaign Creation Fails
- Validate all required fields are provided
- Check user has proper organization membership
- Ensure campaign name is unique (if enforced)

## Future Enhancements

Potential features for future development:
- Campaign templates for common campaign types
- Email campaign integration for donor outreach
- Automated progress reports and notifications
- Multi-campaign comparison analytics
- Recurring campaign automation
- Campaign cloning/duplication
- Export campaign reports to PDF
- Donor segmentation based on campaign participation
- Matching gift tracking
- Pledge management within campaigns
