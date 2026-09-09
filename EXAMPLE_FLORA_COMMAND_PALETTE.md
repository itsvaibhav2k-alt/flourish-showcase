# FloraCommandPalette Usage Example

The `FloraCommandPalette` component is a Cmd+K command palette for quick navigation within Flora.

## Location
`/Users/vaibhav/Projects/flourish/src/modules/flora/components/flora-command-palette.tsx`

## Basic Usage

### 1. Import the component

```tsx
import { FloraCommandPalette } from '@/modules/flora/components'
```

### 2. Add to your layout (e.g., FloraShell)

```tsx
export function FloraShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between">
          <div>Flora Logo</div>

          {/* Add the command palette trigger */}
          <FloraCommandPalette />
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}
```

### 3. With action callback

If you want to include custom actions (like "Generate Suggestions"), pass a callback:

```tsx
'use client'

import { FloraCommandPalette } from '@/modules/flora/components'
import { useState } from 'react'

export function FloraHomePage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true)
    try {
      // Your suggestion generation logic here
      await generateSuggestions()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <FloraCommandPalette onGenerateSuggestions={handleGenerateSuggestions} />

      {/* Rest of your page */}
      <div className="p-6">
        {isGenerating && <div>Generating suggestions...</div>}
      </div>
    </div>
  )
}
```

## Features

### Keyboard Shortcuts
- **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) - Open command palette
- **Escape** - Close command palette
- **Arrow Keys** - Navigate commands
- **Enter** - Execute selected command

### Available Commands

#### Navigation (always available)
- Go to Flora Home → `/flora`
- Compose Email → `/flora/compose`
- Email Sequences → `/flora/sequences`
- Ask Flora → `/flora/ask`
- Smart Ask Calculator → `/flora/smart-ask`
- Grant Writer → `/flora/grants`
- AI Insights → `/flora/insights`
- AI Settings → `/flora/settings`

#### Actions (optional)
- Generate Suggestions - Only shown if `onGenerateSuggestions` prop is provided

### Props

```typescript
interface FloraCommandPaletteProps {
  onGenerateSuggestions?: () => void
}
```

- `onGenerateSuggestions` (optional) - Callback function to execute when "Generate Suggestions" is selected

## Styling

The component uses:
- Tailwind CSS v4 for styling
- Violet theme colors matching Flora's design system
- Backdrop blur overlay
- Smooth animations (fade-in, zoom-in)
- Responsive design

## Implementation Details

- Uses `cmdk` library for command palette functionality
- Next.js `useRouter` for client-side navigation
- Manages its own open/close state
- Automatically focuses search input when opened
- Closes on outside click or Escape key
- Groups commands by category (Navigation, Actions)
