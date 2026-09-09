"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Mockup, MockupFrame } from "@/components/ui/mockup"
import { ArrowRight } from "lucide-react"

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: string
  eyebrow?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  mockupImage?: {
    src: string
    alt: string
    width: number
    height: number
  }
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ className, title, subtitle, eyebrow, ctaText, ctaLink, secondaryCtaText, secondaryCtaLink, mockupImage, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center", className)}
        {...props}
      >
        {eyebrow && (
          <p
            className="font-instrument-sans uppercase tracking-[0.25em] leading-[133%] text-center text-sm md:text-base mt-24 md:mt-32 lg:mt-40 mb-6 md:mb-8 text-primary-600 animate-appear opacity-0"
          >
            {eyebrow}
          </p>
        )}

        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-center px-4 lg:px-[200px] xl:px-[314px] text-neutral-900 animate-appear opacity-0 delay-100"
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-lg md:text-xl lg:text-2xl text-center font-instrument-sans font-light px-4 lg:px-[200px] xl:px-[314px] mt-6 mb-8 md:mb-10 leading-relaxed text-neutral-600 animate-appear opacity-0 delay-300"
          >
            {subtitle}
          </p>
        )}

        {(ctaText && ctaLink) && (
          <div className="flex flex-col sm:flex-row gap-4 animate-appear opacity-0 delay-300">
            <Link href={ctaLink}>
              <div
                className="inline-flex items-center bg-gradient-primary text-white rounded-[12px] hover:opacity-95 transition-all duration-150 font-instrument-sans px-6 py-3 md:px-8 md:py-4 shadow-primary hover:shadow-primary-hover"
              >
                <span className="text-base md:text-lg whitespace-nowrap">{ctaText}</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
            {secondaryCtaText && secondaryCtaLink && (
              <Link href={secondaryCtaLink}>
                <div
                  className="inline-flex items-center justify-center bg-white text-neutral-700 border border-neutral-200 rounded-[12px] hover:bg-neutral-50 hover:border-neutral-300 transition-colors duration-150 font-instrument-sans px-6 py-3 md:px-8 md:py-4"
                >
                  <span className="text-base md:text-lg whitespace-nowrap">{secondaryCtaText}</span>
                </div>
              </Link>
            )}
          </div>
        )}

        {mockupImage && (
          <div className="mt-16 md:mt-20 w-full relative animate-appear opacity-0 delay-300 px-4 md:px-8 lg:px-16">
            <MockupFrame className="bg-primary-50/50">
              <Mockup type="responsive">
                <Image
                  src={mockupImage.src}
                  alt={mockupImage.alt}
                  width={mockupImage.width}
                  height={mockupImage.height}
                  className="w-full"
                  priority
                />
              </Mockup>
            </MockupFrame>
          </div>
        )}
      </div>
    )
  }
)
Hero.displayName = "Hero"

export { Hero }
