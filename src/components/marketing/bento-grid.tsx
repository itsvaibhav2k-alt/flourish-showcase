"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface BentoItem {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  iconClassName?: string
  size?: "sm" | "md" | "lg" | "wide" | "tall"
  highlight?: boolean
  gradient?: "purple" | "teal" | "amber" | "rose" | "default"
}

interface BentoGridProps {
  items: BentoItem[]
  className?: string
}

interface BentoCardProps extends BentoItem {
  index?: number
}

// Use centralized accent utilities from globals.css
const gradientStyles = {
  purple: {
    bg: "accent-purple-bg",
    icon: "bg-primary-600",
    iconText: "text-white",
    border: "accent-purple-border",
  },
  teal: {
    bg: "accent-teal-bg",
    icon: "bg-teal-600",
    iconText: "text-white",
    border: "accent-teal-border",
  },
  amber: {
    bg: "accent-amber-bg",
    icon: "bg-amber-600",
    iconText: "text-white",
    border: "accent-amber-border",
  },
  rose: {
    bg: "accent-rose-bg",
    icon: "bg-rose-600",
    iconText: "text-white",
    border: "accent-rose-border",
  },
  default: {
    bg: "bg-white",
    icon: "bg-primary-600",
    iconText: "text-white",
    border: "border-neutral-200",
  },
}

const sizeStyles = {
  sm: "md:col-span-1 md:row-span-1",
  md: "md:col-span-1 md:row-span-1",
  lg: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2 md:row-span-1",
  tall: "md:col-span-1 md:row-span-2",
}

function BentoCard({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  size = "md",
  highlight = false,
  gradient = "default",
  index = 0,
}: BentoCardProps) {
  const colors = gradientStyles[gradient]
  const isLarge = size === "lg" || size === "tall"

  return (
    <div
      className={cn(
        // Base styles
        "group relative overflow-hidden rounded-[16px] border bg-white",
        // Hover effects - subtle 2px lift
        "hover-lift hover:shadow-card-hover",
        // Background and border
        colors.bg,
        colors.border,
        // Size
        sizeStyles[size],
        // Padding based on size
        isLarge ? "p-8" : "p-6",
        // Highlight styles
        highlight && "ring-2 ring-primary-500/20 ring-offset-2",
        className
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-[12px] shadow-sm",
            colors.icon,
            isLarge ? "mb-6 h-16 w-16" : "mb-4 h-12 w-12",
            iconClassName
          )}
        >
          <Icon
            className={cn(
              colors.iconText,
              isLarge ? "h-8 w-8" : "h-6 w-6"
            )}
          />
        </div>

        {/* Text content */}
        <div className={cn("flex flex-col", isLarge && "flex-1")}>
          <h3
            className={cn(
              "font-semibold text-neutral-900 mb-2",
              isLarge ? "text-xl md:text-2xl" : "text-lg"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-neutral-600 leading-relaxed",
              isLarge ? "text-base md:text-lg" : "text-sm"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6",
        className
      )}
    >
      {items.map((item, index) => (
        <BentoCard key={index} {...item} index={index} />
      ))}
    </div>
  )
}

// Alternative layout for homepage - clean bento grid
export function BentoGridHomepage({ items, className }: BentoGridProps) {
  // Balanced bento layout: 4 columns with specific placements
  // Row 1: [1-2] [3] [4]  (wide, normal, normal)
  // Row 2: [1] [2-3] [4]  (normal, wide, normal)
  const gridPlacements = [
    "md:col-span-2", // Card 1: spans 2 cols
    "md:col-span-1", // Card 2: spans 1 col
    "md:col-span-1", // Card 3: spans 1 col
    "md:col-span-1", // Card 4: spans 1 col
    "md:col-span-2", // Card 5: spans 2 cols
    "md:col-span-1", // Card 6: spans 1 col
  ]

  const layoutGradients: Array<BentoItem["gradient"]> = [
    "purple",
    "teal",
    "amber",
    "rose",
    "default",
    "teal",
  ]

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 auto-rows-fr",
        className
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        const gradient = layoutGradients[index % layoutGradients.length]
        const colors = gradientStyles[gradient]
        const isWide = gridPlacements[index]?.includes("col-span-2")

        return (
          <div
            key={index}
            className={cn(
              // Base styles
              "group relative overflow-hidden rounded-[16px] border bg-white",
              // Hover effects - subtle 2px lift
              "hover-lift hover:shadow-card-hover",
              // Background and border
              colors.bg,
              colors.border,
              // Grid placement
              gridPlacements[index],
              // Padding
              "p-6",
              // Highlight first card
              index === 0 && "ring-2 ring-primary-500/20 ring-offset-2"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Content */}
            <div className={cn("relative z-10", isWide ? "flex items-start gap-5" : "")}>
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-[12px] shadow-sm",
                  colors.icon,
                  "h-12 w-12 flex-shrink-0",
                  !isWide && "mb-4"
                )}
              >
                <Icon className={cn("h-6 w-6", colors.iconText)} />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 mb-1.5 text-base">
                  {item.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Feature page layout - 2x2 grid
export function BentoGridFeatures({ items, className }: BentoGridProps) {
  const layoutGradients: Array<BentoItem["gradient"]> = [
    "purple",
    "teal",
    "amber",
    "rose",
  ]

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
        className
      )}
    >
      {items.map((item, index) => (
        <BentoCard
          key={index}
          {...item}
          size="md"
          gradient={layoutGradients[index % layoutGradients.length]}
          highlight={index === 0}
          index={index}
        />
      ))}
    </div>
  )
}

export { BentoCard }
