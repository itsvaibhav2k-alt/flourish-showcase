"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface WordRevealProps {
  text: string
  className?: string
  delay?: number
}

export function WordReveal({ text, className, delay = 0 }: WordRevealProps) {
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

  const words = text.split(" ")

  return (
    <div ref={containerRef} className={cn("flex flex-wrap", className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden mr-[0.25em]"
        >
          <span
            className={cn(
              "inline-block transition-all duration-700",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${delay + index * 80}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </div>
  )
}
