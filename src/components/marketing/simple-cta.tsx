"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleCTAProps {
  title: string
  ctaText: string
  ctaLink: string
  subtitle?: string
  className?: string
}

export function SimpleCTA({
  title,
  ctaText,
  ctaLink,
  subtitle,
  className,
}: SimpleCTAProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-instrument-serif font-normal text-neutral-900 mb-4">
            {title}
          </h2>

          {subtitle && (
            <p className="text-lg font-instrument-sans text-neutral-600 mb-8 max-w-xl mx-auto">
              {subtitle}
            </p>
          )}

          <Link href={ctaLink}>
            <Button
              className={cn(
                "bg-neutral-900 hover:bg-neutral-800 text-white",
                "px-8 py-6 text-base font-medium",
                "transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                "shadow-lg shadow-neutral-900/10",
                "hover:shadow-xl hover:shadow-neutral-900/20"
              )}
            >
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          {/* Minimal decorative underline */}
          <div className="mt-12 flex justify-center">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
