# Giving Potential Components - Visual Reference

## Component Hierarchy

```
giving-potential/components/
├── giving-potential-badge.tsx       (50 lines)  - Compact score indicator
├── score-meter.tsx                  (185 lines) - Progress bars & circular meters
├── giving-potential-panel.tsx       (341 lines) - Full detail panel with edit mode
├── giving-potential-form.tsx        (297 lines) - Data entry form
├── prospect-list.tsx                (246 lines) - Sortable table of prospects
└── index.ts                         (6 lines)   - Public exports
```

## Visual Layout Examples

### 1. Contact Card / List View
```
┌─────────────────────────────────┐
│ John Smith                      │
│ john@example.com                │
│ [💎 High Potential]             │ ← GivingPotentialBadge
└─────────────────────────────────┘
```

### 2. Contact Detail Panel
```
┌───────────────────────────────────────────────────┐
│ 📈 Giving Potential                    [Edit]    │
│ AI-powered donor capacity analysis                │
├───────────────────────────────────────────────────┤
│                                                   │
│              ┌─────────┐                          │
│              │   85    │  ← CircularScoreMeter   │
│              └─────────┘                          │
│           Overall Potential                       │
│                                                   │
├───────────────────────────────────────────────────┤
│ Score Breakdown                                   │
│                                                   │
│ Capacity     ████████░░ 80                        │
│ Affinity     ██████████ 95   ← ScoreMeter        │
│ Propensity   ███████░░░ 75                        │
│                                                   │
├───────────────────────────────────────────────────┤
│ 💰 Giving Gap Analysis                            │
│                                                   │
│  Capacity      Current         Gap               │
│  $50,000       $10,000       $40,000             │
│                                                   │
├───────────────────────────────────────────────────┤
│ Wealth Indicators                                 │
│                                                   │
│ 💼 Employer: Tech Corp      👥 CEO               │
│ 🏠 Real Estate: $1.2M       📈 Stocks: $500K     │
│ 💵 Net Worth: $2M                                 │
│                                                   │
├───────────────────────────────────────────────────┤
│ Philanthropy Activity                             │
│                                                   │
│ [Political: $5,000] [3 Boards]                    │
└───────────────────────────────────────────────────┘
```

### 3. Edit Form View
```
┌───────────────────────────────────────────────────┐
│ Edit Giving Potential               [Cancel]     │
│                                                   │
├───────────────────────────────────────────────────┤
│ 💼 Employment Information                         │
│                                                   │
│ Employer          │ Job Title                     │
│ [____________]    │ [____________]                │
│                                                   │
├───────────────────────────────────────────────────┤
│ 💰 Wealth Indicators                              │
│                                                   │
│ Estimated Net Worth     │ Real Estate Value      │
│ $[____________]         │ $[____________]        │
│                                                   │
│ Stock Holdings          │ Political Donations    │
│ $[____________]         │ $[____________]        │
│                                                   │
├───────────────────────────────────────────────────┤
│ Philanthropy Activity                             │
│                                                   │
│ Nonprofit Board Memberships                      │
│ [___]                                             │
│                                                   │
├───────────────────────────────────────────────────┤
│ 📝 Notes                                          │
│                                                   │
│ [_____________________________________________]   │
│ [_____________________________________________]   │
│                                                   │
├───────────────────────────────────────────────────┤
│                              [Save Changes]       │
└───────────────────────────────────────────────────┘
```

### 4. Prospects Table
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Name              Score         Cap    Capacity    Current      Gap    Actions│
├──────────────────────────────────────────────────────────────────────────────┤
│ Jane Doe          [High]        85     $100,000    $15,000   $85,000  [View] │
│ jane@example.com                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ John Smith        [High]        82     $75,000     $20,000   $55,000  [View] │
│ john@example.com                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Bob Johnson       [Medium]      68     $50,000     $10,000   $40,000  [View] │
│ bob@example.com                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Showing 3 prospects              Total Gap: $180,000                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Color Coding Reference

### Score Colors
- **80-100** (High): Green
  - Badge: `bg-green-100 text-green-800 border-green-200`
  - Meter: `bg-green-600`

- **50-79** (Medium): Amber/Yellow
  - Badge: `bg-amber-100 text-amber-800 border-amber-200`
  - Meter: `bg-amber-500`

- **0-49** (Low): Gray
  - Badge: `bg-neutral-100 text-neutral-600 border-neutral-200`
  - Meter: `bg-neutral-400`

### UI Elements
- Primary Actions: `bg-primary-600` (purple)
- Accents: `bg-primary-50` (light purple)
- Info Panels: `from-primary-50 to-violet-50` (gradient)

## Icons Used

| Component | Icon | Source |
|-----------|------|--------|
| Badge (High) | 💎 Gem | lucide-react |
| Badge (Medium) | 📈 TrendingUp | lucide-react |
| Badge (Low) | ➖ Minus | lucide-react |
| Panel Header | 📈 TrendingUp | lucide-react |
| Giving Gap | 💰 DollarSign | lucide-react |
| Employer | 💼 Briefcase | lucide-react |
| Job Title | 👥 Users | lucide-react |
| Real Estate | 🏠 Home | lucide-react |
| Stocks | 📈 LineChart | lucide-react |
| Edit Button | ✏️ Edit2 | lucide-react |
| View Button | 👁️ Eye | lucide-react |
| Sort Columns | ⬍ ArrowUpDown | lucide-react |
| Notes | 📝 FileText | lucide-react |

## Responsive Behavior

### GivingPotentialPanel
- **Desktop (lg+)**: Full width with all sections visible
- **Tablet**: Stacked sections, full width
- **Mobile**: Single column, condensed metrics

### GivingPotentialForm
- **Desktop**: 2-column grid for wealth fields
- **Mobile**: Single column layout

### ProspectList
- **Desktop**: Full table with all columns
- **Tablet**: Horizontal scroll enabled
- **Mobile**: Horizontal scroll with sticky first column (not implemented)

## Animation States

### Score Meters
```typescript
// On mount
displayScore: 0 → score (over 500ms)

// CSS transitions
transition-all duration-500 ease-out
```

### Circular Meter
```typescript
// SVG stroke animation
strokeDashoffset: calculated based on score
transition-all duration-500 ease-out
```

### Hover States
```typescript
// Table rows
hover:bg-neutral-100/50

// Action buttons (fade in)
opacity-0 group-hover:opacity-100 transition-opacity
```

## Empty States

### Panel (No Data)
```
┌───────────────────────────────────┐
│ 📈 Giving Potential               │
├───────────────────────────────────┤
│          ⚠️                        │
│                                   │
│   No data available               │
│   Add employment and wealth       │
│   information to calculate        │
│   giving potential                │
│                                   │
│        [Add Data]                 │
└───────────────────────────────────┘
```

### ProspectList (No Prospects)
```
┌───────────────────────────────────┐
│          📈                        │
│                                   │
│   No prospects yet                │
│   Add giving potential data to    │
│   contacts to see top prospects   │
└───────────────────────────────────┘
```

## Integration Points

### Required Server Actions
```typescript
// src/modules/giving-potential/actions/save-giving-potential.ts
export async function saveGivingPotential(
  contactId: string,
  data: GivingPotentialFormData
): Promise<{ success: boolean; error?: string }>
```

### Expected Data Queries
```typescript
// src/modules/giving-potential/queries/get-giving-potential.ts
export async function getGivingPotential(contactId: string)

// src/modules/giving-potential/queries/get-top-prospects.ts
export async function getTopProspects(limit?: number)
```

## TypeScript Interfaces

All components are fully typed with TypeScript. See individual component files for detailed prop interfaces.

Key shared types:
- `GivingPotentialData` - Full potential data object
- `GivingPotentialFormData` - Form input data
- `Prospect` - Prospect list item
- `SortField` - Table sort fields
- `SortOrder` - 'asc' | 'desc'
