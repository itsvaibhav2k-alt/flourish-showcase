# Impact Stories Components - Quick Start Guide

## 🚀 Get Started in 60 Seconds

### 1. View the Demo

```tsx
import { ImpactStoryDemo } from '@/modules/impact/components'

// Render the demo page to see all components in action
<ImpactStoryDemo />
```

### 2. Add Generation Button to Donor Page

```tsx
import { GenerateStoryButton } from '@/modules/impact/components'

<GenerateStoryButton
  donorId={donor.id}
  donorName="Sarah Johnson"
  totalDonation={5000}
  organizationName="Hope Foundation"
/>
```

That's it! The button will show a mock impact story (no backend needed for testing).

---

## 📦 All Components at a Glance

### ImpactStoryCard
**What:** Full impact story with headline, metrics, and sharing
**When:** Display a complete impact story to a donor
**Where:** Donor portal, dedicated impact pages

```tsx
<ImpactStoryCard
  donorName="Sarah"
  headline="Sarah, You Changed 47 Lives"
  narrative="Your incredible generosity..."
  metrics={[...]}
  totalDonation={5000}
/>
```

---

### ImpactBreakdown
**What:** Grid of metrics with animated counters
**When:** Show impact metrics in a visual way
**Where:** Inside story cards or standalone

```tsx
<ImpactBreakdown
  metrics={[
    { type: 'meals', value: 235, label: 'Meals Provided', icon: 'meals' }
  ]}
  animated={true}
/>
```

---

### ShareableCard
**What:** Social media card (1200x630px)
**When:** Generate images for social sharing
**Where:** Export/download features

```tsx
<ShareableCard
  donorName="Sarah"
  headline="You Changed 47 Lives"
  keyMetrics={[...]}
  organizationName="Hope Foundation"
/>
```

---

### ImpactMetricsInput
**What:** Admin form to configure program metrics
**When:** Org needs to set up impact calculations
**Where:** Settings/admin pages

```tsx
<ImpactMetricsInput
  organizationId="org_123"
  onSave={saveProgramMetrics}
/>
```

---

### GenerateStoryButton
**What:** Button that triggers AI story generation
**When:** Let users create their impact story
**Where:** Donor detail pages, donor portal

```tsx
<GenerateStoryButton
  donorId="donor_123"
  donorName="Sarah Johnson"
  totalDonation={5000}
  onGenerate={generateImpactStory}
/>
```

---

## 🎨 Icon Options

Use these values for the `icon` property:

- `meals` - 🍽️ Food/meals (amber)
- `families` - 🏠 Families/homes (teal)
- `users` - 👥 People (primary purple)
- `books` - 📚 Education (violet)
- `medical` - 💊 Healthcare (rose)
- `clothing` - 👕 Clothing (violet)
- `trees` - 🌳 Environment (green)
- `water` - 💧 Clean water (teal)
- `heart` - ❤️ Love/compassion (rose)
- `sparkles` - ✨ General impact (primary)

---

## 🔌 Backend Integration

When ready to connect to your backend:

```tsx
// 1. Save metrics (admin)
import { saveProgramMetrics } from '@/modules/impact/actions'

<ImpactMetricsInput
  organizationId={org.id}
  onSave={saveProgramMetrics}  // Server action
/>

// 2. Generate stories (donors)
import { generateImpactStory } from '@/modules/impact/actions'

<GenerateStoryButton
  donorId={donor.id}
  donorName={donor.name}
  totalDonation={donor.lifetimeGiving}
  onGenerate={generateImpactStory}  // AI-powered generation
/>
```

---

## 💡 Pro Tips

1. **Testing:** All components work with mock data - no backend required
2. **Customization:** Pass `className` to any component for custom styles
3. **Responsive:** All components are mobile-first and fully responsive
4. **Type Safety:** IntelliSense will guide you with all available props
5. **Composition:** Mix and match components as needed
6. **Demo Page:** Use `ImpactStoryDemo` for stakeholder demos

---

## 🎯 Common Use Cases

### Donor Portal
```tsx
<GenerateStoryButton
  donorId={donor.id}
  donorName={donor.name}
  totalDonation={donor.lifetimeGiving}
  variant="primary"
  size="lg"
/>
```

### Settings Page
```tsx
<ImpactMetricsInput
  organizationId={org.id}
  initialMetrics={existingMetrics}
  onSave={handleSave}
/>
```

### Email Campaign
Generate impact story, get shareable link, send to donor.

### Social Media
Use `ShareableCard` to create OG images for Twitter/Facebook.

---

That's all you need to get started! 🎉

For full documentation, see:
- `README.md` - Component API reference
- `COMPONENTS.md` - Detailed technical docs
- `impact-story-demo.tsx` - Live examples
