"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface Value {
  number: string
  title: string
  description: string
}

interface NumberedValuesProps {
  values: Value[]
  className?: string
}

function ValueItem({
  value,
  index,
  isVisible,
}: {
  value: Value
  index: number
  isVisible: boolean
}) {
  // Alternate positioning: even indexes to left, odd to right
  const isLeft = index % 2 === 0

  return (
    <div
      className={cn(
        "relative py-8 md:py-12 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        // Staggered left/right positioning on larger screens
        "lg:w-4/5",
        isLeft ? "lg:mr-auto" : "lg:ml-auto"
      )}
      style={{
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Large Number */}
        <div className="flex-shrink-0">
          <span
            className={cn(
              "text-6xl md:text-7xl lg:text-8xl font-instrument-serif font-normal",
              "bg-gradient-to-b from-primary-400 to-primary-200 bg-clip-text text-transparent",
              "select-none leading-none"
            )}
          >
            {value.number}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 pt-2">
          <h3 className="text-xl md:text-2xl font-instrument-serif font-normal text-neutral-900 mb-3">
            {value.title}
          </h3>
          <p className="text-base md:text-lg font-instrument-sans text-neutral-600 leading-relaxed max-w-xl">
            {value.description}
          </p>
        </div>
      </div>

      {/* Decorative line connector */}
      {index < 3 && (
        <div
          className={cn(
            "hidden lg:block absolute h-px bg-gradient-to-r",
            isLeft
              ? "from-primary-200 to-transparent right-0 w-1/4"
              : "from-transparent to-primary-200 left-0 w-1/4",
            "bottom-0"
          )}
        />
      )}
    </div>
  )
}

export function NumberedValues({ values, className }: NumberedValuesProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Vertical line decoration */}
      <div className="absolute left-8 md:left-12 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary-200 to-transparent opacity-50" />

      {/* Values list */}
      <div className="relative space-y-4 md:space-y-8">
        {values.map((value, index) => (
          <ValueItem
            key={index}
            value={value}
            index={index}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  )
}
