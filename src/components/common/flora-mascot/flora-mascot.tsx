'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { FloraMascotProps, FLORA_SIZE_MAP } from './types'
import { useFloraAnimation } from './use-flora-animation'
import { FloraTooltip } from './flora-tooltip'

export function FloraMascot({
  size = 'md',
  state = 'idle',
  tooltip,
  showTooltip = false,
  tooltipPosition = 'right',
  onClick,
  className,
}: FloraMascotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTooltipOpen, setIsTooltipOpen] = useState(showTooltip)

  const { animationState, reducedMotion } = useFloraAnimation({
    initialState: state,
    isHovered,
    isTooltipVisible: isTooltipOpen,
  })

  const { width, height } = FLORA_SIZE_MAP[size]

  // Select image based on animation state
  const imageSrc =
    animationState === 'explaining' || animationState === 'thinking'
      ? '/flora-explaining.png'
      : '/flora-waving.png'

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleClick = useCallback(() => {
    if (tooltip) {
      setIsTooltipOpen((prev) => !prev)
    }
    onClick?.()
  }, [tooltip, onClick])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const handleTooltipOpenChange = useCallback((open: boolean) => {
    setIsTooltipOpen(open)
  }, [])

  const mascotElement = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-lg transition-transform duration-200',
        'hover:scale-105 focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        onClick || tooltip ? 'cursor-pointer' : 'cursor-default',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      aria-label="Flora, your AI assistant. Click for helpful tips."
      tabIndex={onClick || tooltip ? 0 : -1}
    >
      <div
        className={cn(
          'transition-all duration-300',
          !reducedMotion && 'animate-flora-float',
          !reducedMotion && isHovered && 'animate-flora-wave'
        )}
      >
        <Image
          src={imageSrc}
          alt="Flora mascot"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    </button>
  )

  if (tooltip) {
    return (
      <FloraTooltip
        content={tooltip}
        open={isTooltipOpen}
        onOpenChange={handleTooltipOpenChange}
        position={tooltipPosition}
      >
        {mascotElement}
      </FloraTooltip>
    )
  }

  return mascotElement
}
