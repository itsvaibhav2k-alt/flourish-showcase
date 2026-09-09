# Giving Potential Components

UI components for the Giving Potential feature in Flourish. These components display donor capacity analysis, wealth indicators, and prospect management.

## Components

### 1. GivingPotentialBadge

Small badge showing overall giving potential score with color coding.

**Props:**
- `score: number` - The overall score (0-100)
- `className?: string` - Optional CSS classes
- `showIcon?: boolean` - Show icon in badge (default: true)

**Usage:**
```tsx
import { GivingPotentialBadge } from '@/modules/giving-potential/components'

<GivingPotentialBadge score={85} />
```

**Color Coding:**
- Green (80+): High Potential
- Yellow (50-79): Medium Potential
- Gray (<50): Low Potential

---

### 2. ScoreMeter

Reusable progress bar meter for displaying individual scores.

**Props:**
- `score: number` - The score value (0-100)
- `label?: string` - Label text
- `showNumber?: boolean` - Display score number (default: true)
- `size?: 'sm' | 'md' | 'lg'` - Meter size (default: 'md')
- `animated?: boolean` - Animate on load (default: true)
- `className?: string` - Optional CSS classes

**Usage:**
```tsx
import { ScoreMeter } from '@/modules/giving-potential/components'

<ScoreMeter score={75} label="Capacity" size="md" />
```

---

### 3. CircularScoreMeter

Circular/radial meter variant for dashboard displays.

**Props:**
- `score: number` - The score value (0-100)
- `label?: string` - Label text below meter
- `size?: number` - Diameter in pixels (default: 120)
- `strokeWidth?: number` - Circle stroke width (default: 8)
- `animated?: boolean` - Animate on load (default: true)
- `className?: string` - Optional CSS classes

**Usage:**
```tsx
import { CircularScoreMeter } from '@/modules/giving-potential/components'

<CircularScoreMeter score={85} label="Overall Potential" size={140} />
```

---

### 4. GivingPotentialPanel

Detailed panel for contact detail page showing all scores, wealth breakdown, and giving gap.

**Props:**
- `contactId: string` - Contact ID
- `data?: GivingPotentialData | null` - Giving potential data object
- `className?: string` - Optional CSS classes

**Data Interface:**
```tsx
interface GivingPotentialData {
  overall_score: number
  capacity_score: number
  affinity_score: number
  propensity_score: number
  estimated_capacity: number
  current_giving: number
  employer?: string | null
  job_title?: string | null
  estimated_net_worth?: number | null
  real_estate_value?: number | null
  stock_holdings?: number | null
  political_donations?: number | null
  nonprofit_board_count?: number | null
  notes?: string | null
}
```

**Usage:**
```tsx
import { GivingPotentialPanel } from '@/modules/giving-potential/components'

<GivingPotentialPanel
  contactId={contact.id}
  data={givingPotentialData}
/>
```

**Features:**
- Overall score with circular meter
- Score breakdown (capacity, affinity, propensity)
- Giving gap analysis
- Wealth indicators display
- Philanthropy activity badges
- Edit mode toggle
- Empty state with "Add Data" CTA

---

### 5. GivingPotentialForm

Form to manually enter/edit giving potential data.

**Props:**
- `contactId: string` - Contact ID
- `initialData?: GivingPotentialFormData` - Initial form values
- `onSuccess?: () => void` - Callback on successful save
- `className?: string` - Optional CSS classes

**Usage:**
```tsx
import { GivingPotentialForm } from '@/modules/giving-potential/components'

<GivingPotentialForm
  contactId={contact.id}
  initialData={existingData}
  onSuccess={() => console.log('Saved!')}
/>
```

**Form Fields:**
- Employment: employer, job_title
- Wealth: estimated_net_worth, real_estate_value, stock_holdings, political_donations
- Philanthropy: nonprofit_board_count
- Notes: free-form text field

**Features:**
- React state-based form handling
- Currency input fields with $ prefix
- Error and success messages
- Loading states
- Calls `saveGivingPotential` server action
- Auto-refresh on success

---

### 6. ProspectList

Sortable table of top prospects with giving potential scores.

**Props:**
- `prospects: Prospect[]` - Array of prospect data
- `className?: string` - Optional CSS classes

**Prospect Interface:**
```tsx
interface Prospect {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  overall_score: number
  capacity_score: number
  estimated_capacity: number
  current_giving: number
  giving_gap: number
}
```

**Usage:**
```tsx
import { ProspectList } from '@/modules/giving-potential/components'

<ProspectList prospects={topProspects} />
```

**Features:**
- Sortable columns (name, scores, capacity, gap)
- Color-coded giving gap indicators
- Click-through to contact detail
- Summary footer with total gap
- Empty state
- Hover actions

**Columns:**
1. Name (with email)
2. Overall Score (badge)
3. Capacity Score (numeric)
4. Estimated Capacity (currency)
5. Current Giving (currency)
6. Gap (currency with trend indicator)
7. View action button

---

## Color System

All components use the project's Tailwind color palette:

- **Green**: High potential (80+) - `green-600`, `green-100`
- **Amber/Yellow**: Medium potential (50-79) - `amber-500`, `amber-100`
- **Gray/Neutral**: Low potential (<50) - `neutral-400`, `neutral-100`
- **Primary Purple**: Accents and actions - `primary-600`, `primary-50`

---

## Animations

- Score meters animate on mount with 500ms duration
- Controlled by `animated` prop (can disable)
- Respects `prefers-reduced-motion`
- Smooth transitions using Tailwind utilities

---

## Dependencies

All components use:
- `@/components/ui/*` - shadcn/ui base components
- `lucide-react` - Icons
- `@/lib/utils` - `cn()` utility for class merging
- Tailwind CSS v4 - Styling

---

## Server Actions Required

The `GivingPotentialForm` expects a server action at:
```
src/modules/giving-potential/actions/save-giving-potential.ts
```

Expected signature:
```tsx
export async function saveGivingPotential(
  contactId: string,
  data: GivingPotentialFormData
): Promise<{ success: boolean; error?: string }>
```

---

## Example Usage in Page

```tsx
import {
  GivingPotentialPanel,
  GivingPotentialBadge,
  ProspectList
} from '@/modules/giving-potential/components'

// Contact detail page
export default function ContactPage({ contact, givingPotential }) {
  return (
    <div>
      <h1>{contact.name}</h1>
      <GivingPotentialBadge score={givingPotential.overall_score} />

      <GivingPotentialPanel
        contactId={contact.id}
        data={givingPotential}
      />
    </div>
  )
}

// Prospects dashboard
export default function ProspectsPage({ prospects }) {
  return (
    <div>
      <h1>Top Prospects</h1>
      <ProspectList prospects={prospects} />
    </div>
  )
}
```
