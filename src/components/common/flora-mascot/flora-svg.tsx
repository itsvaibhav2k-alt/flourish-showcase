'use client'

import { cn } from '@/lib/utils'
import { FloraSvgProps } from './types'

export function FloraSvg({
  width,
  height,
  animationState,
  reducedMotion,
  className,
}: FloraSvgProps) {
  const getAnimationClasses = () => {
    if (reducedMotion) return ''

    switch (animationState) {
      case 'idle':
        return 'flora-sway'
      case 'waving':
        return 'flora-wave'
      case 'thinking':
        return 'flora-float'
      case 'explaining':
        return 'flora-float'
      default:
        return ''
    }
  }

  const getBlinkClass = () => {
    if (reducedMotion) return ''
    return animationState === 'idle' ? 'flora-blink' : ''
  }

  const getLeafClass = () => {
    if (reducedMotion) return ''
    return animationState === 'waving' ? 'flora-leaf-wave' : ''
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(getAnimationClasses(), className)}
      aria-hidden="true"
    >
      {/* Stem */}
      <g id="flora-stem">
        <path
          d="M32 45 L32 72"
          stroke="#14b8a6"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Left Leaf */}
      <g id="flora-leaf-left" className={getLeafClass()}>
        <path
          d="M32 58 Q22 54 18 60 Q22 66 32 62"
          fill="#14b8a6"
        />
        <path
          d="M32 60 Q24 58 20 60"
          stroke="#0d9488"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Right Leaf */}
      <g id="flora-leaf-right" className={getLeafClass()}>
        <path
          d="M32 52 Q42 48 46 54 Q42 60 32 56"
          fill="#14b8a6"
        />
        <path
          d="M32 54 Q40 52 44 54"
          stroke="#0d9488"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Petals - Back layer */}
      <g id="flora-petals-back">
        {/* Top-left petal */}
        <ellipse
          cx="22"
          cy="22"
          rx="10"
          ry="14"
          fill="#22a558"
          transform="rotate(-30 22 22)"
        />
        {/* Top-right petal */}
        <ellipse
          cx="42"
          cy="22"
          rx="10"
          ry="14"
          fill="#22a558"
          transform="rotate(30 42 22)"
        />
        {/* Bottom-left petal */}
        <ellipse
          cx="20"
          cy="36"
          rx="9"
          ry="12"
          fill="#4ade7f"
          transform="rotate(-60 20 36)"
        />
        {/* Bottom-right petal */}
        <ellipse
          cx="44"
          cy="36"
          rx="9"
          ry="12"
          fill="#4ade7f"
          transform="rotate(60 44 36)"
        />
      </g>

      {/* Petals - Front layer */}
      <g id="flora-petals-front">
        {/* Top petal */}
        <ellipse
          cx="32"
          cy="12"
          rx="10"
          ry="14"
          fill="#16804d"
        />
        {/* Left petal */}
        <ellipse
          cx="18"
          cy="28"
          rx="9"
          ry="13"
          fill="#16804d"
          transform="rotate(-45 18 28)"
        />
        {/* Right petal */}
        <ellipse
          cx="46"
          cy="28"
          rx="9"
          ry="13"
          fill="#16804d"
          transform="rotate(45 46 28)"
        />
      </g>

      {/* Face (center circle) */}
      <g id="flora-face">
        <circle cx="32" cy="30" r="14" fill="#fbbf24" />
        <circle cx="32" cy="30" r="12" fill="#fcd34d" />

        {/* Eyes */}
        <g id="flora-eyes" className={getBlinkClass()}>
          {/* Left eye */}
          <ellipse cx="27" cy="28" rx="2.5" ry="3" fill="#44403c" />
          <circle cx="26" cy="27" r="1" fill="white" />
          {/* Right eye */}
          <ellipse cx="37" cy="28" rx="2.5" ry="3" fill="#44403c" />
          <circle cx="36" cy="27" r="1" fill="white" />
        </g>

        {/* Smile */}
        <path
          d="M27 34 Q32 38 37 34"
          stroke="#44403c"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Rosy cheeks */}
        <circle cx="22" cy="32" r="2.5" fill="#f9a8d4" opacity="0.6" />
        <circle cx="42" cy="32" r="2.5" fill="#f9a8d4" opacity="0.6" />
      </g>
    </svg>
  )
}
