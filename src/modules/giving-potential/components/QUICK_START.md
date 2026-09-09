# Quick Start Guide - Giving Potential Components

## Import All Components

```tsx
import {
  GivingPotentialBadge,
  ScoreMeter,
  CircularScoreMeter,
  GivingPotentialPanel,
  GivingPotentialForm,
  ProspectList
} from '@/modules/giving-potential/components'
```

## 1. Add Badge to Contact Card

```tsx
<div className="flex items-center gap-2">
  <h3>{contact.name}</h3>
  <GivingPotentialBadge score={contact.giving_potential.overall_score} />
</div>
```

## 2. Add Panel to Contact Detail Page

```tsx
<GivingPotentialPanel
  contactId={contact.id}
  data={contact.giving_potential}
/>
```

## 3. Show Prospects Table

```tsx
<ProspectList prospects={topProspects} />
```

## 4. Add Score Meters to Dashboard

```tsx
<div className="grid grid-cols-3 gap-4">
  <ScoreMeter score={75} label="Capacity" />
  <ScoreMeter score={85} label="Affinity" />
  <ScoreMeter score={60} label="Propensity" />
</div>
```

## 5. Show Circular Score

```tsx
<div className="flex justify-center">
  <CircularScoreMeter
    score={82}
    label="Overall Potential"
    size={160}
  />
</div>
```

## Color Coding

| Score | Color | Badge Text |
|-------|-------|------------|
| 80-100 | Green | High Potential |
| 50-79 | Amber | Medium Potential |
| 0-49 | Gray | Low Potential |

## Required Server Action

Create this file:
```
src/modules/giving-potential/actions/save-giving-potential.ts
```

```tsx
'use server'

import { revalidatePath } from 'next/cache'

export async function saveGivingPotential(
  contactId: string,
  data: GivingPotentialFormData
) {
  // Your database logic here
  // Calculate scores
  // Update contact

  revalidatePath(`/contacts/${contactId}`)

  return { success: true }
}
```

## Common Props

### Badge
- `score` (required): 0-100
- `showIcon`: boolean (default: true)

### ScoreMeter
- `score` (required): 0-100
- `label`: string
- `size`: 'sm' | 'md' | 'lg'
- `animated`: boolean (default: true)

### Panel
- `contactId` (required): string
- `data`: GivingPotentialData | null

### Form
- `contactId` (required): string
- `initialData`: GivingPotentialFormData
- `onSuccess`: () => void

### ProspectList
- `prospects` (required): Prospect[]

## Tips

1. Use badges in contact lists and cards
2. Use panel on detail pages
3. Use prospect list for dashboards
4. Use score meters for breakdowns
5. Use circular meters for highlights

## Need Help?

See full documentation:
- README.md - Complete API reference
- COMPONENTS.md - Visual layouts
- SUMMARY.md - Build details
