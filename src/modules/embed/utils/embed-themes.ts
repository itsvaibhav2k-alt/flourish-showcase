/**
 * Theme configuration for embeddable widgets
 * Supports light/dark modes and custom accent colors
 */

export type EmbedTheme = 'light' | 'dark'

export interface EmbedThemeConfig {
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgHover: string
  bgCard: string
  bgCardHover: string

  // Text colors
  textPrimary: string
  textSecondary: string
  textMuted: string

  // Border colors
  border: string
  borderHover: string

  // Status colors
  statusOpen: { bg: string; text: string }
  statusFull: { bg: string; text: string }
  statusLow: { bg: string; text: string }

  // Overlay
  overlayBg: string
}

export const lightTheme: EmbedThemeConfig = {
  bgPrimary: 'bg-white',
  bgSecondary: 'bg-neutral-50',
  bgHover: 'hover:bg-neutral-100',
  bgCard: 'bg-white',
  bgCardHover: 'hover:bg-neutral-50',

  textPrimary: 'text-neutral-900',
  textSecondary: 'text-neutral-700',
  textMuted: 'text-neutral-500',

  border: 'border-neutral-200',
  borderHover: 'hover:border-neutral-300',

  statusOpen: { bg: 'bg-green-100', text: 'text-green-800' },
  statusFull: { bg: 'bg-neutral-100', text: 'text-neutral-800' },
  statusLow: { bg: 'bg-amber-100', text: 'text-amber-800' },

  overlayBg: 'bg-black/50',
}

export const darkTheme: EmbedThemeConfig = {
  bgPrimary: 'bg-neutral-900',
  bgSecondary: 'bg-neutral-800',
  bgHover: 'hover:bg-neutral-700',
  bgCard: 'bg-neutral-800',
  bgCardHover: 'hover:bg-neutral-700',

  textPrimary: 'text-neutral-50',
  textSecondary: 'text-neutral-200',
  textMuted: 'text-neutral-400',

  border: 'border-neutral-700',
  borderHover: 'hover:border-neutral-600',

  statusOpen: { bg: 'bg-green-900/50', text: 'text-green-300' },
  statusFull: { bg: 'bg-neutral-700', text: 'text-neutral-300' },
  statusLow: { bg: 'bg-amber-900/50', text: 'text-amber-300' },

  overlayBg: 'bg-black/70',
}

export function getThemeConfig(theme: EmbedTheme): EmbedThemeConfig {
  return theme === 'dark' ? darkTheme : lightTheme
}

/**
 * Generate accent color styles from hex color
 */
export function getAccentStyles(accentColor?: string): React.CSSProperties {
  if (!accentColor) return {}

  // Validate hex color format
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!hexRegex.test(accentColor)) return {}

  const color = accentColor.startsWith('#') ? accentColor : `#${accentColor}`

  return {
    '--embed-accent': color,
    '--embed-accent-light': `${color}20`,
    '--embed-accent-hover': `${color}e6`,
  } as React.CSSProperties
}

/**
 * Generate button classes with custom accent color
 */
export function getAccentButtonClasses(theme: EmbedTheme, hasAccent: boolean): string {
  if (hasAccent) {
    return 'text-white hover:opacity-90'
  }

  if (theme === 'dark') {
    return 'bg-primary-500 text-white hover:bg-primary-400'
  }

  return 'bg-primary-600 text-white hover:bg-primary-700'
}

/**
 * CSS variables for accent color styling
 */
export const accentColorStyles = `
  .embed-accent-bg {
    background-color: var(--embed-accent, #16804d);
  }
  .embed-accent-bg-light {
    background-color: var(--embed-accent-light, #16804d20);
  }
  .embed-accent-text {
    color: var(--embed-accent, #16804d);
  }
  .embed-accent-border {
    border-color: var(--embed-accent, #16804d);
  }
`
