import { ReactNode } from 'react'

export type FloraAnimationState = 'idle' | 'waving' | 'thinking' | 'explaining'

export type FloraSize = 'sm' | 'md' | 'lg'

export type FloraTooltipPosition = 'top' | 'right' | 'bottom' | 'left'

export interface FloraMascotProps {
  /** Size of the Flora mascot */
  size?: FloraSize
  /** Current animation state */
  state?: FloraAnimationState
  /** Tooltip content to display */
  tooltip?: string | ReactNode
  /** Whether to show the tooltip */
  showTooltip?: boolean
  /** Position of the tooltip relative to Flora */
  tooltipPosition?: FloraTooltipPosition
  /** Click handler */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

export interface FloraSvgProps {
  /** Width of the SVG */
  width: number
  /** Height of the SVG */
  height: number
  /** Current animation state */
  animationState: FloraAnimationState
  /** Whether animations should be reduced */
  reducedMotion: boolean
  /** Additional CSS classes */
  className?: string
}

export interface UseFloraAnimationOptions {
  /** Initial animation state */
  initialState?: FloraAnimationState
  /** Whether the component is being hovered */
  isHovered?: boolean
  /** Whether tooltip is visible */
  isTooltipVisible?: boolean
}

export interface UseFloraAnimationReturn {
  /** Current animation state */
  animationState: FloraAnimationState
  /** Whether user prefers reduced motion */
  reducedMotion: boolean
  /** Set the animation state manually */
  setAnimationState: (state: FloraAnimationState) => void
}

export const FLORA_SIZE_MAP: Record<FloraSize, { width: number; height: number }> = {
  sm: { width: 48, height: 72 },
  md: { width: 80, height: 120 },
  lg: { width: 120, height: 180 },
}
