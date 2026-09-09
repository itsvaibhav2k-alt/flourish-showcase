# Impact Stories UI Components

Beautiful, emotional UI components for displaying personalized donor impact stories in Flourish.

## Overview

This module contains 5 core UI components + 1 demo component that work together to create stunning impact stories for donors. These components use Flourish's design system with purple gradients, animated counters, and emotional copy to connect donors with the real-world impact of their giving.

## Components Created

### 1. **impact-story-card.tsx** ✨

The hero component - a full-featured impact story card with everything donors need to see and share their impact.

**Features:**
- 🎨 Beautiful gradient header (primary purple to violet)
- 📝 Large emotional headline
- 💬 Narrative paragraph about their impact
- 📊 Impact breakdown section
- ❤️ Thank you message in highlighted box
- 🔗 Share buttons (Twitter, Facebook, Copy Link)
- 📥 Optional download/print button
- ✨ Floating decorative background elements

**Props:**
```typescript
{
  donorName: string              // "Sarah Johnson"
  headline: string               // "Sarah, You Changed 47 Lives"
  narrative: string              // Impact narrative paragraph
  metrics: ImpactMetric[]        // Array of impact metrics
  totalDonation: number          // Total donation amount
  organizationName?: string      // Org name for thank you
  onShare?: (platform) => void   // Share callback
  onDownload?: () => void        // Download callback
}
```

**Use Case:** Main impact story display on donor portal, email links, or dedicated impact pages

---

### 2. **impact-breakdown.tsx** 📊

Grid display of impact metrics with beautiful icons, animated counters, and hover effects.

**Features:**
- 📱 Responsive grid (1-3 columns)
- 🎯 Color-coded icon badges
- ⏱️ Animated counters (scroll-triggered)
- 🖱️ Smooth hover effects
- 🔢 Auto-formatted numbers (1,234 or 1.2k)
- 🎨 12 different icon options

**Available Icons:**
- `heart` (rose) - Love, compassion
- `users` (primary) - People helped
- `meals` (amber) - Food provided
- `families` (teal) - Families supported
- `books` (violet) - Education
- `medical` (rose) - Healthcare
- `clothing` (violet) - Clothing
- `trees` (green) - Environmental
- `water` (teal) - Clean water
- `sparkles` (primary) - General impact

**Props:**
```typescript
{
  metrics: ImpactMetric[]        // Metrics to display
  animated?: boolean             // Enable counter animation (default: true)
}
```

**Use Case:** Standalone metrics display or embedded in other components

---

### 3. **shareable-card.tsx** 📱

Social media-optimized card with fixed 1200x630 aspect ratio (Open Graph standard).

**Features:**
- 📏 Fixed size for social media (1200x630px)
- 🏢 Organization logo placement
- 📊 Top 3 key metrics
- 💬 Call-to-action text
- 🎨 Branded gradient background
- 📸 Screenshot-ready design

**Props:**
```typescript
{
  donorName: string              // First name for personalization
  headline: string               // Impact headline
  keyMetrics: ImpactMetric[]     // Top 3 metrics
  organizationName: string       // Organization name
  organizationLogo?: string      // Logo URL
  callToAction?: string          // CTA text
}
```

**Use Case:** Generate Open Graph images, social sharing, downloadable graphics

---

### 4. **impact-metrics-input.tsx** ⚙️

Admin form for organizations to define program metrics that power impact calculations.

**Features:**
- ➕ Add/edit/delete program metrics
- 📝 Program name, metric name, value, cost per unit
- 🎨 Icon selector (12 options)
- 📅 Time period selector
- 💡 Example calculations
- ✅ Field validation
- 💾 Save callback

**Props:**
```typescript
{
  organizationId: string                    // Organization ID
  initialMetrics?: ProgramMetric[]          // Existing metrics
  onSave?: (metrics) => Promise<void>       // Save callback
}
```

**Metric Fields:**
- `programName` - "Food Bank", "Housing Support"
- `metricName` - "Meals Provided", "Families Housed"
- `value` - Total units in time period (10,000)
- `costPerUnit` - Cost per unit in dollars (5.00)
- `icon` - Icon identifier from available set

**Use Case:** Settings page for org admins to configure impact metrics

---

### 5. **generate-story-button.tsx** 🚀

Interactive button that triggers AI story generation with loading states and result modal.

**Features:**
- ⏳ Loading state with spinner
- ❌ Error handling
- 📝 Result display in dialog
- 🎨 Multiple button variants
- 🧪 Mock mode for testing
- 📊 Displays full ImpactStoryCard in modal

**Props:**
```typescript
{
  donorId: string                           // Donor ID
  donorName: string                         // Full name
  totalDonation: number                     // Lifetime giving
  organizationName?: string                 // Org name
  onGenerate?: (id) => Promise<ImpactStory> // Generation callback
  variant?: 'default' | 'primary' | ...     // Button style
  size?: 'default' | 'sm' | 'lg'            // Button size
  className?: string                        // Additional classes
}
```

**Use Case:** Donor detail pages, donor portal, email campaigns

---

### 6. **impact-story-demo.tsx** 🎭 (Bonus)

Comprehensive demo page showcasing all components with tabs, examples, and usage code.

**Features:**
- 📑 Tabbed interface for each component
- 🎨 Live component previews
- 📝 Usage examples with code
- 🧪 Interactive testing
- 📖 Integration documentation

**Use Case:** Development, testing, stakeholder demos

---

## Design Principles

### Visual Design
- **Gradients:** Purple to violet for headers and backgrounds
- **Icons:** Color-coded by category (meals=amber, families=teal, etc.)
- **Typography:** Uses Flourish's heading utilities for impact
- **Spacing:** Generous padding for emotional breathing room
- **Animations:** Subtle, meaningful (counter animations, hover effects)

### Emotional Connection
- **Personalization:** Uses donor's first name prominently
- **Concrete Impact:** Specific numbers, not vague statements
- **Gratitude:** Warm thank-you messages
- **Visual Impact:** Large headlines, beautiful gradients
- **Social Proof:** Easy sharing to amplify impact

### Technical Excellence
- ✅ Client components (`'use client'`)
- ✅ TypeScript with full type safety
- ✅ Responsive design (mobile-first)
- ✅ Accessible (semantic HTML, ARIA)
- ✅ Performant (optimized animations)
- ✅ Reusable (composable components)

---

## Integration Guide

### Basic Usage (Donor Detail Page)

```tsx
import { GenerateStoryButton } from '@/modules/impact/components'

export default function DonorPage({ donor }) {
  return (
    <div>
      <h1>{donor.name}</h1>

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

### Settings Page (Admin Metrics)

```tsx
import { ImpactMetricsInput } from '@/modules/impact/components'

export default function SettingsPage({ org }) {
  return (
    <div>
      <h2>Impact Metrics Configuration</h2>

      <ImpactMetricsInput
        organizationId={org.id}
        initialMetrics={org.programMetrics}
        onSave={saveProgramMetrics}
      />
    </div>
  )
}
```

### Standalone Impact Page

```tsx
import { ImpactStoryCard } from '@/modules/impact/components'

export default function ImpactPage({ story }) {
  return (
    <ImpactStoryCard
      donorName={story.donorName}
      headline={story.headline}
      narrative={story.narrative}
      metrics={story.metrics}
      totalDonation={story.totalDonation}
      organizationName="Hope Foundation"
    />
  )
}
```

---

## File Structure

```
src/modules/impact/components/
├── impact-story-card.tsx       # Main story display card
├── impact-breakdown.tsx        # Metrics grid with animations
├── shareable-card.tsx          # Social media card (1200x630)
├── impact-metrics-input.tsx    # Admin metrics form
├── generate-story-button.tsx   # Generation trigger button
├── impact-story-demo.tsx       # Demo/testing page
└── index.ts                    # Public exports
```

---

## Dependencies

All components use existing Flourish UI primitives:
- `@/components/ui/card` - Card components
- `@/components/ui/button` - Button variants
- `@/components/ui/input` - Form inputs
- `@/components/ui/label` - Form labels
- `@/components/ui/select` - Dropdowns
- `@/components/ui/dialog` - Modals
- `@/components/ui/tabs` - Tab navigation
- `lucide-react` - Icons

No additional dependencies required! 🎉

---

## Next Steps

To complete the Impact Stories feature:

1. ✅ **UI Components** (DONE - this document)
2. ⏳ **Database Schema** - Add `program_metrics` table
3. ⏳ **Server Actions** - Create save/fetch actions
4. ⏳ **AI Integration** - Connect Claude API for story generation
5. ⏳ **Routes** - Add impact story pages to app router
6. ⏳ **Testing** - Unit tests for components
7. ⏳ **Documentation** - User guide for admins

---

## Tips for Success

**For Developers:**
- Start with the demo component to see all features
- Components are fully typed - IntelliSense will guide you
- All components work standalone or composed together
- Mock data is included for easy testing

**For Designers:**
- Colors and gradients use design tokens
- Easy to customize via Tailwind classes
- Icon system is extensible
- Animations can be disabled via props

**For Product:**
- Components are donor-centric and emotional
- Social sharing built-in for viral growth
- Admin metrics input is intuitive
- Impact is concrete and quantifiable

---

Built with ❤️ for Flourish - Making nonprofit impact visible and shareable.
