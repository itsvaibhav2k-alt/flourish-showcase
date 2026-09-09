# Page Guide System Architecture

## Component Hierarchy

```
App Root
└── PageGuideProvider (Context Provider)
    ├── Your App Content
    │   └── Any Page
    │       └── PageGuideTrigger (opens guide for specific page)
    │
    └── PageGuideWrapper (listens to context)
        └── PageGuideSidebar (renders when open)
            ├── Sheet (from shadcn/ui)
            │   ├── FloraMascot (explaining state)
            │   ├── Purpose section
            │   ├── Key Features (with icons)
            │   ├── Best Practices (bulleted list)
            │   └── Pro Tips (amber box with lightbulb)
            └── Content from page-guides.ts
```

## Data Flow

```
User clicks PageGuideTrigger
         ↓
  usePageGuide().openGuide(pageKey)
         ↓
  Context updates: { isOpen: true, currentPage: 'donors' }
         ↓
  PageGuideWrapper receives context update
         ↓
  PageGuideSidebar renders with pageKey
         ↓
  getPageGuide(pageKey) fetches content
         ↓
  Sheet slides in from right
         ↓
  User sees Flora + page guide content
```

## State Management

### Global State (PageGuideContext)
- `isOpen: boolean` - Whether sidebar is currently open
- `currentPage: string | null` - Which page guide to show
- `openGuide(pageKey: string)` - Function to open a guide
- `closeGuide()` - Function to close the guide

### Local State (PageGuideSidebar)
- LocalStorage: `page-guide-${pageKey}` - Persists user preference
- Content: Loaded from `page-guides.ts` based on pageKey

## Component Responsibilities

### PageGuideContext
- Manages global state
- Provides hooks for opening/closing
- Single source of truth

### PageGuideProvider
- Wraps app at root level
- Makes context available everywhere
- Must be parent of both trigger and wrapper

### PageGuideTrigger
- User-facing button
- Calls `openGuide(pageKey)`
- Shows tooltip on hover
- Can be used multiple times on same page

### PageGuideWrapper
- Listens to context changes
- Renders PageGuideSidebar when needed
- Only one instance needed (at app level)

### PageGuideSidebar
- Displays the actual content
- Loads from page-guides.ts
- Manages localStorage persistence
- Converts icon names to components
- Handles open/close animations

## Icon Mapping System

The sidebar converts kebab-case icon names to PascalCase Lucide components:

```
"bar-chart-2"    → BarChart2
"kanban-square"  → KanbanSquare
"alert-triangle" → AlertTriangle
"dollar-sign"    → DollarSign
```

Algorithm:
1. Split on hyphen: ["bar", "chart", "2"]
2. Capitalize each: ["Bar", "Chart", "2"]
3. Join: "BarChart2"
4. Import from lucide-react dynamically
5. Fallback to HelpCircle if not found

## Content Structure

```typescript
// page-guides.ts
{
  pageKey: {
    title: "Page Title",
    purpose: "What this page does",
    keyFeatures: [
      {
        icon: "lucide-icon-name",
        title: "Feature Name",
        description: "What it does"
      }
    ],
    bestPractices: ["Do this", "Don't do that"],
    tips: ["Pro tip 1", "Pro tip 2"]
  }
}
```

## Styling Tokens

### Colors
- Primary gradient: `from-primary-50 to-primary-100`
- Icon color: `text-primary-600`
- Tips background: `bg-amber-50 border-amber-100`
- Tips text: `text-amber-800`

### Sizes
- Sidebar width: `w-[400px]`
- Icon container: `h-8 w-8`
- Icon size: `h-4 w-4`
- Flora mascot: `size="sm"`

### Spacing
- Section gap: `space-y-6`
- Feature gap: `space-y-3`
- List gap: `space-y-2`

## LocalStorage

Each page guide tracks its own state:
```
Key: page-guide-${pageKey}
Value: "open" | "closed"

Examples:
- page-guide-dashboard: "open"
- page-guide-donors: "closed"
- page-guide-volunteers: "open"
```

## Extension Points

### Add New Page Guide
1. Add entry to `page-guides.ts`
2. Use Lucide icon names in kebab-case
3. Add PageGuideTrigger to the page
4. No code changes needed

### Custom Trigger Placement
```tsx
<PageGuideTrigger pageKey="donors" className="ml-auto" />
```

### Programmatic Control
```tsx
const { openGuide } = usePageGuide()
openGuide('dashboard') // Open from anywhere
```

### Check if Guide Exists
```tsx
import { hasPageGuide } from '@/lib/content/page-guides'

if (hasPageGuide('mypage')) {
  // Show trigger
}
```

## Performance Considerations

1. **Context Updates**: Only re-renders when isOpen or currentPage changes
2. **Content Loading**: Loaded synchronously from static data
3. **Icon Mapping**: Cached by React, no repeated lookups
4. **localStorage**: Try/catch blocks prevent errors
5. **Animations**: GPU-accelerated slide transitions

## Accessibility

- Semantic HTML (sections, headings, lists)
- ARIA labels on trigger button
- Keyboard navigation supported (Sheet handles this)
- Focus management (Sheet handles this)
- Reduced motion support (via Sheet animations)

## Browser Support

- Modern browsers with ES6+ support
- localStorage API required
- Radix UI dialog/sheet support
- CSS Grid and Flexbox

## Testing Strategy

1. **Unit Tests**: Test context provider and hooks
2. **Integration Tests**: Test trigger → sidebar flow
3. **Visual Tests**: Verify layout and animations
4. **Accessibility Tests**: ARIA, keyboard nav, screen readers
5. **localStorage Tests**: Persistence across sessions
