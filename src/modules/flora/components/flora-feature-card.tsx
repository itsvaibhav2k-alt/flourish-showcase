'use client'

import Link from 'next/link'

interface FloraFeatureCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  disabled?: boolean
  compact?: boolean
}

export function FloraFeatureCard({
  href,
  icon,
  title,
  description,
  disabled = false,
  compact = false,
}: FloraFeatureCardProps) {
  const cardContent = (
    <div
      className={`
        relative rounded-xl border bg-white transition-all
        ${compact ? 'p-4' : 'p-6'}
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer group hover:bg-neutral-50 hover:border-violet-200'
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          text-violet-600
          ${compact ? 'h-5 w-5 mb-2' : 'h-8 w-8 mb-3'}
        `}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm mb-1' : 'text-base mb-2'}`}>{title}</h3>

      {/* Description */}
      <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
    </div>
  )

  // If disabled, render without Link
  if (disabled) {
    return cardContent
  }

  // Otherwise wrap in Link with focus styles
  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
    >
      {cardContent}
    </Link>
  )
}
