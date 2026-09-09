# AI Tiles Components

Beautiful, animated AI insight tiles for the Flourish dashboard. Built with Framer Motion for smooth animations and @dnd-kit for drag-and-drop reordering.

## Components

### Core Components

#### `AITileCard`
Base card component that provides consistent styling and animations for all AI tiles.

**Features:**
- Framer Motion spring animations for hover/tap
- Shimmer loading state with gradient animation
- AI sparkle indicator with pulse animation
- Optional refresh functionality
- Last updated timestamp

**Props:**
```typescript
interface AITileCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  lastUpdated?: Date
  onRefresh?: () => void
  className?: string
}
```

#### `AITileSkeleton`
Loading skeleton that matches the layout of actual tiles with shimmer animation.

**Usage:**
```tsx
<AITileSkeleton />
```

### Insight Tiles

#### `DonorHealthTile`
Displays donor health metrics including:
- Overall health score with animated ring
- At-risk donors list with avatars
- Giving trends with color-coded indicators
- AI-generated recommendations

**Props:**
```typescript
interface DonorHealthTileProps {
  data: DonorHealthInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}
```

**Data Structure:**
```typescript
interface DonorHealthInsight {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  atRiskDonors: AtRiskDonor[]
  givingTrend: GivingTrend
  recommendations: string[]
  totalAtRisk: number
  healthScore: number // 0-100
}
```

#### `WeeklyPrioritiesTile`
Shows priority contacts and quick wins:
- Priority contacts with success probability
- Expected value indicators
- Quick wins section
- Focus area banner

**Props:**
```typescript
interface WeeklyPrioritiesTileProps {
  data: WeeklyPrioritiesInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}
```

#### `OrgPulseTile`
Organization health dashboard:
- Overall health score with animated ring and pulse effect
- Key metrics grid with trend indicators
- Alerts section with severity levels
- Opportunities list

**Props:**
```typescript
interface OrgPulseTileProps {
  data: OrgPulseInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}
```

#### `CustomTile`
Flexible tile for custom AI-generated content:
- Custom summary section
- Dynamic data display with multiple types (text, number, currency, percentage)
- Insights list
- Optional action button

**Props:**
```typescript
interface CustomTileProps {
  data: CustomInsight | null
  isLoading: boolean
  onRefresh?: () => void
  lastUpdated?: Date
}
```

### Layout Components

#### `TileGrid`
Responsive grid container with drag-drop reordering:
- 1 column on mobile, 2-3 columns on desktop
- Drag handles for reordering (when enabled)
- Framer Motion layout animations
- Staggered entrance animations

**Props:**
```typescript
interface TileGridProps {
  tiles: TileConfig[]
  onReorder?: (tiles: TileConfig[]) => void
  isDraggable?: boolean
  className?: string
}
```

#### `SimpleTileGrid`
Simplified grid without drag-drop (still animated):
```typescript
<SimpleTileGrid tiles={tiles} />
```

## Animations

### Spring Physics
All hover and tap interactions use spring physics for natural feel:
```typescript
whileHover={{ y: -4 }}
transition={{ type: 'spring', stiffness: 400, damping: 10 }}
```

### Staggered Entrance
Tiles animate in with staggered delays:
```typescript
transition={{ staggerChildren: 0.1 }}
```

### Progress Ring Animation
Health scores animate with smooth SVG circle animation:
```typescript
animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
transition={{ duration: 1, ease: 'easeOut' }}
```

### Pulse Animation
AI sparkle icon pulses continuously:
```typescript
animate={{ rotate: [0, 5, -5, 5, 0], scale: [1, 1.1, 1, 1.1, 1] }}
transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
```

### Shimmer Loading
Loading state uses CSS shimmer animation:
```css
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
```

## Usage Examples

### Basic Usage
```tsx
import { DonorHealthTile, SimpleTileGrid } from '@/modules/ai-tiles/components'

export function Dashboard() {
  const [data, setData] = useState<DonorHealthInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <SimpleTileGrid
      tiles={[
        {
          id: 'donor-health',
          component: (
            <DonorHealthTile
              data={data}
              isLoading={isLoading}
              onRefresh={fetchData}
              lastUpdated={new Date()}
            />
          ),
        },
      ]}
    />
  )
}
```

### Draggable Grid
```tsx
import { TileGrid } from '@/modules/ai-tiles/components'

export function CustomizableDashboard() {
  const [tiles, setTiles] = useState<TileConfig[]>([...])

  const handleReorder = (newTiles: TileConfig[]) => {
    setTiles(newTiles)
    // Save to database or localStorage
  }

  return (
    <TileGrid
      tiles={tiles}
      onReorder={handleReorder}
      isDraggable={true}
    />
  )
}
```

### Custom Tile
```tsx
import { CustomTile } from '@/modules/ai-tiles/components'
import { Users } from 'lucide-react'

const customData: CustomInsight = {
  title: 'Volunteer Engagement',
  icon: Users,
  summary: 'Your volunteer program is thriving!',
  insights: [
    'Top volunteers averaging 12 hours/month',
    '3 volunteers ready for leadership roles',
  ],
  data: [
    { key: 'active', label: 'Active Volunteers', value: 87, type: 'number' },
    { key: 'hours', label: 'Total Hours', value: 1240, type: 'number' },
  ],
  actionUrl: '/volunteers',
  actionLabel: 'View All Volunteers',
}

<CustomTile data={customData} isLoading={false} />
```

### Grid Span Control
```tsx
{
  id: 'org-pulse',
  component: <OrgPulseTile data={data} isLoading={false} />,
  gridSpan: 'double', // Takes 2 columns on desktop
}
```

## Animation Requirements

### Included Animations
- ✅ Spring physics for hover/tap interactions
- ✅ Staggered entrance animations for tile grid
- ✅ Smooth layout animations when tiles reorder
- ✅ Pulse animation on AI sparkle icon
- ✅ Progress ring animation for health scores
- ✅ Number counting animations for metrics (via Framer Motion)
- ✅ Shimmer loading state

### Performance Considerations
- Uses `transform` and `opacity` for GPU-accelerated animations
- Respects `prefers-reduced-motion` media query
- Lazy loading with `AnimatePresence` for mount/unmount
- Efficient re-renders with React.memo where appropriate

## Styling

All components use:
- Tailwind CSS v4 for styling
- Custom color palette from `globals.css`
- Consistent shadow utilities (`shadow-card`, `shadow-card-hover`)
- Responsive breakpoints (mobile, tablet, desktop)

## Dependencies

Required packages:
- `framer-motion` - Animations
- `@dnd-kit/core` - Drag and drop core
- `@dnd-kit/sortable` - Sortable utilities
- `@dnd-kit/utilities` - Helper utilities
- `lucide-react` - Icons
- `date-fns` - Date formatting

## Accessibility

- Keyboard navigation support for drag-drop
- Semantic HTML structure
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Respects reduced motion preferences

## See Also

- [example-usage.tsx](./components/example-usage.tsx) - Full working examples
- [Custom Tile Builder](./components/custom-tile-builder.tsx) - Build custom tiles programmatically
