"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import Image from "next/image"

interface FeatureShowcaseProps {
  title: string
  description: string
  features: string[]
  imageSrc?: string
  imageAlt?: string
  reversed?: boolean
  className?: string
}

export function FeatureShowcase({
  title,
  description,
  features,
  imageSrc,
  imageAlt = "Feature illustration",
  reversed = false,
  className,
}: FeatureShowcaseProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center",
        className
      )}
    >
      {/* Text Content */}
      <div className={cn("space-y-6", reversed && "lg:order-2")}>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-instrument-serif font-normal text-neutral-900 leading-tight">
          {title}
        </h3>
        <p className="text-lg font-instrument-sans text-neutral-600 leading-relaxed">
          {description}
        </p>

        {/* Feature List */}
        <ul className="space-y-4 pt-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                <Check className="w-4 h-4 text-primary-600" />
              </span>
              <span className="font-instrument-sans text-neutral-700">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image/Illustration */}
      <div className={cn("relative", reversed && "lg:order-1")}>
        {imageSrc ? (
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200/60 shadow-lg shadow-primary-500/10">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          /* Placeholder illustration when no image provided */
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/60">
            {/* Decorative elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary-200/50 blur-2xl" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-lg bg-white/80 shadow-lg shadow-primary-500/20 border border-primary-200/40" />
            <div className="absolute top-1/3 right-1/4 w-24 h-20 rounded-lg bg-white/80 shadow-lg shadow-primary-500/20 border border-primary-200/40" />
            <div className="absolute bottom-1/4 left-1/3 w-20 h-24 rounded-lg bg-white/80 shadow-lg shadow-primary-500/20 border border-primary-200/40" />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
        )}

        {/* Decorative accent */}
        <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200/50" />
      </div>
    </div>
  )
}
