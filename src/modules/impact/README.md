# Impact Stories Module

Beautiful UI components for generating and displaying personalized donor impact stories in Flourish.

## Components

### 1. ImpactStoryCard

A stunning card that displays a donor's personalized impact story with gradient backgrounds and modern design.

**Features:**
- Large, emotional headline (e.g., "Sarah, You Changed 47 Lives")
- Narrative paragraph explaining the impact
- Visual breakdown of metrics with icons
- Share buttons for Twitter, Facebook, and copy link
- Optional download/print functionality
- Gradient background with decorative elements
- Thank you message section

**Usage:**
```tsx
import { ImpactStoryCard } from '@/modules/impact/components'

<ImpactStoryCard
  donorName="Sarah Johnson"
  headline="Sarah, You Changed 47 Lives"
  narrative="Your incredible generosity has created a ripple effect of hope..."
  metrics={[
    { type: 'meals', value: 235, label: 'Meals Provided', icon: 'meals' },
    { type: 'families', value: 12, label: 'Families Housed', icon: 'families' }
  ]}
  totalDonation={5000}
  organizationName="Hope Foundation"
  onShare={(platform) => console.log(`Shared on ${platform}`)}
  onDownload={() => console.log('Downloading...')}
/>
```

### 2. ImpactBreakdown

Visual grid display of impact metrics with animated counters and color-coded icons.

**Features:**
- Responsive grid layout (1-3 columns)
- Icon badges with color coding
- Animated counters (on scroll into view)
- Hover effects
- Auto-formats large numbers

**Usage:**
```tsx
import { ImpactBreakdown } from '@/modules/impact/components'

<ImpactBreakdown
  metrics={[
    { type: 'meals', value: 235, label: 'Meals Provided', icon: 'meals' },
    { type: 'families', value: 12, label: 'Families Housed', icon: 'families' },
    { type: 'children', value: 47, label: 'Children Helped', icon: 'users' }
  ]}
  animated={true}
/>
```

**Available Icons:**
- `heart` - Hearts/love
- `users` - People/beneficiaries
- `meals` - Food/meals
- `families` - Families/homes
- `books` - Education/books
- `medical` - Healthcare/medicine
- `clothing` - Clothing/apparel
- `trees` - Environmental/trees
- `water` - Water/clean water
- `sparkles` - General impact

### 3. ShareableCard

Social media-optimized card with fixed 1200x630 aspect ratio (Open Graph image size).

**Features:**
- Perfect for social sharing
- Organization logo placement
- Key metrics display
- Call-to-action text
- Gradient background matching brand
- Optimized for screenshots

**Usage:**
```tsx
import { ShareableCard } from '@/modules/impact/components'

<ShareableCard
  donorName="Sarah"
  headline="You Changed 47 Lives"
  keyMetrics={[
    { type: 'meals', value: 235, label: 'Meals', icon: 'meals' },
    { type: 'families', value: 12, label: 'Families', icon: 'families' },
    { type: 'children', value: 47, label: 'Children', icon: 'users' }
  ]}
  organizationName="Hope Foundation"
  organizationLogo="/logo.png"
  callToAction="Join us in making a difference"
/>
```

### 4. ImpactMetricsInput

Admin form for organizations to define program metrics that power impact calculations.

**Features:**
- Add/edit/delete program metrics
- Define cost per unit for each metric
- Time period selector
- Icon selection
- Example calculations
- Validates all required fields
- Calls save action when submitted

**Usage:**
```tsx
import { ImpactMetricsInput } from '@/modules/impact/components'

<ImpactMetricsInput
  organizationId="org_123"
  initialMetrics={[
    {
      id: '1',
      programName: 'Food Bank',
      metricName: 'Meals Provided',
      value: 10000,
      costPerUnit: 5.0,
      icon: 'meals'
    }
  ]}
  onSave={async (metrics) => {
    // Call your save action
    await saveProgramMetrics(metrics)
  }}
/>
```

**Metric Fields:**
- `programName` - Name of the program (e.g., "Food Bank")
- `metricName` - What is being measured (e.g., "Meals Provided")
- `value` - Total units achieved in time period
- `costPerUnit` - Cost in dollars per unit (e.g., $5 per meal)
- `icon` - Icon identifier from available set

### 5. GenerateStoryButton

Button component that triggers AI impact story generation with loading states and result dialog.

**Features:**
- Loading state during generation
- Error handling
- Result display in dialog
- Customizable button style
- Mock mode for testing

**Usage:**
```tsx
import { GenerateStoryButton } from '@/modules/impact/components'

<GenerateStoryButton
  donorId="donor_123"
  donorName="Sarah Johnson"
  totalDonation={5000}
  organizationName="Hope Foundation"
  onGenerate={async (donorId) => {
    // Call your generation action
    return await generateImpactStory(donorId)
  }}
  variant="primary"
  size="default"
/>
```

## Design System

All components use Flourish's design tokens:

**Colors:**
- Primary: Purple gradient (`primary-500` to `violet-600`)
- Accent: Teal, Amber, Rose for metric categories
- Neutral: Warm gray scale

**Typography:**
- Headlines use `heading-display` utility
- Body text uses project font stack
- Proper hierarchy with semantic HTML

**Spacing:**
- Consistent padding/margins
- Responsive breakpoints
- Mobile-first approach

## Integration Example

Typical flow for adding impact stories to a donor detail page:

```tsx
// In your donor detail page
import { GenerateStoryButton } from '@/modules/impact/components'

export default function DonorDetailPage({ donor }) {
  return (
    <div>
      <h1>{donor.name}</h1>

      {/* Add button to generate impact story */}
      <GenerateStoryButton
        donorId={donor.id}
        donorName={donor.name}
        totalDonation={donor.lifetimeGiving}
        organizationName="Hope Foundation"
        onGenerate={generateImpactStory}
      />
    </div>
  )
}
```

## Notes

- All components are client components (`'use client'`)
- Components use existing Flourish UI primitives
- Fully responsive and accessible
- Beautiful gradient backgrounds and animations
- Optimized for emotional connection with donors
- Ready for social media sharing
