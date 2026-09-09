# Page Guide System

A contextual help system for Flourish that provides users with page-specific guidance through a slide-out sidebar with Flora mascot.

## Components

### 1. PageGuideProvider
React context provider that manages the global state of the page guide system.

### 2. PageGuideWrapper
Renders the actual sidebar based on the context state. Place this once at the app level.

### 3. PageGuideTrigger
A button with a help icon that opens the guide for a specific page.

### 4. PageGuideSidebar
The actual sidebar component (usually not used directly).

## Setup

### 1. Wrap your app with the provider

In your root layout or app component:

```tsx
import { PageGuideProvider } from '@/components/common/page-guide'
import { PageGuideWrapper } from '@/components/common/page-guide'

export default function RootLayout({ children }) {
  return (
    <PageGuideProvider>
      {children}
      <PageGuideWrapper />
    </PageGuideProvider>
  )
}
```

### 2. Add triggers to your pages

In any page where you want to show a guide:

```tsx
import { PageGuideTrigger } from '@/components/common/page-guide'

export default function DonorsPage() {
  return (
    <div>
      <header className="flex items-center justify-between">
        <h1>Donors</h1>
        <PageGuideTrigger pageKey="donors" />
      </header>
      {/* Rest of your page */}
    </div>
  )
}
```

### 3. Define your page guide content

In `/src/lib/content/page-guides.ts`:

```ts
export const pageGuides: Record<string, PageGuide> = {
  mypage: {
    title: "My Page Title",
    purpose: "A clear description of what this page is for",
    keyFeatures: [
      {
        icon: "users", // lucide icon name in kebab-case
        title: "Feature Name",
        description: "What this feature does"
      },
      // ... more features
    ],
    bestPractices: [
      "Do this to get the best results",
      "Avoid doing this",
      // ... more practices
    ],
    tips: [
      "Pro tip: This will save you time",
      // ... more tips
    ]
  }
}
```

## Features

- **Flora Mascot Integration**: Shows Flora in "explaining" state for friendly guidance
- **Automatic Icon Mapping**: Converts kebab-case icon names to Lucide components
- **LocalStorage Persistence**: Remembers open/closed state per page
- **Smooth Animations**: Uses Sheet component with slide-in transitions
- **Responsive Design**: 400px sidebar that works on all screen sizes
- **Context-Based State**: Global state management for opening guides from anywhere

## Usage Examples

### Basic Usage
```tsx
<PageGuideTrigger pageKey="dashboard" />
```

### With Custom Styling
```tsx
<PageGuideTrigger pageKey="volunteers" className="ml-auto" />
```

### Programmatic Control
```tsx
import { usePageGuide } from '@/components/common/page-guide'

function MyComponent() {
  const { openGuide, closeGuide } = usePageGuide()

  return (
    <button onClick={() => openGuide('donors')}>
      Show Donors Guide
    </button>
  )
}
```

## Available Page Keys

Current page guides are available for:
- `dashboard` - Dashboard overview
- `donors` - Donor management
- `volunteers` - Volunteer coordination
- `communications` - AI communications
- `pipeline` - Major gift pipeline
- `prospects` - Giving potential

See `/src/lib/content/page-guides.ts` for the complete list.

## Styling

The sidebar uses:
- Width: 400px
- Primary gradient backgrounds (primary-50 to primary-100) for feature icons
- Amber-50 background for tips section
- Smooth scroll behavior
- Consistent spacing with the design system

## Best Practices

1. **Keep content concise**: Users want quick help, not a manual
2. **Use clear language**: Avoid jargon and technical terms
3. **Show don't tell**: Focus on what users can do, not how it works
4. **Update regularly**: Keep guides in sync with feature changes
5. **Test with users**: Ensure guides actually help
