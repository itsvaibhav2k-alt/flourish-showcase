'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FloraAnimationState,
  UseFloraAnimationOptions,
  UseFloraAnimationReturn,
} from './types'

export function useFloraAnimation(
  options: UseFloraAnimationOptions = {}
): UseFloraAnimationReturn {
  const {
    initialState = 'idle',
    isHovered = false,
    isTooltipVisible = false,
  } = options

  const [animationState, setAnimationState] =
    useState<FloraAnimationState>(initialState)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Handle state transitions based on props
  useEffect(() => {
    if (isTooltipVisible) {
      setAnimationState('explaining')
    } else if (isHovered) {
      setAnimationState('waving')
    } else if (initialState !== 'idle') {
      setAnimationState(initialState)
    } else {
      setAnimationState('idle')
    }
  }, [isHovered, isTooltipVisible, initialState])

  const handleSetAnimationState = useCallback((state: FloraAnimationState) => {
    setAnimationState(state)
  }, [])

  return {
    animationState,
    reducedMotion,
    setAnimationState: handleSetAnimationState,
  }
}
