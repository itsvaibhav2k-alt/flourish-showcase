"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

interface TestimonialHeroProps {
  quote: string
  author: string
  role: string
  organization: string
  imageSrc?: string
  className?: string
}

export function TestimonialHero({
  quote,
  author,
  role,
  organization,
  imageSrc,
  className,
}: TestimonialHeroProps) {
  return (
    <div
      className={cn(
        "relative py-16 md:py-24 lg:py-32 overflow-hidden",
        className
      )}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-violet-50/30" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-100/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Large decorative quote mark */}
          <div className="mb-8">
            <svg
              className="w-16 h-16 md:w-20 md:h-20 mx-auto text-primary-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
          </div>

          {/* Quote */}
          <blockquote className="mb-10">
            <p className="text-2xl md:text-3xl lg:text-4xl font-instrument-serif font-normal text-neutral-900 leading-relaxed">
              {quote}
            </p>
          </blockquote>

          {/* Author info */}
          <div className="flex flex-col items-center gap-4">
            {imageSrc && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg shadow-primary-500/10">
                <Image
                  src={imageSrc}
                  alt={author}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center">
              <p className="font-instrument-sans font-semibold text-neutral-900 text-lg">
                {author}
              </p>
              <p className="font-instrument-sans text-neutral-600">
                {role}, <span className="text-primary-600">{organization}</span>
              </p>
            </div>
          </div>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-10">
            <span className="w-2 h-2 rounded-full bg-primary-300" />
            <span className="w-2 h-2 rounded-full bg-primary-400" />
            <span className="w-2 h-2 rounded-full bg-primary-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
