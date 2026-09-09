import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface CTASectionProps {
  title: string
  description: string
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  variant?: "default" | "gradient" | "premium"
  className?: string
}

export function CTASection({
  title,
  description,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  variant = "default",
  className,
}: CTASectionProps) {
  const isPremium = variant === "premium" || variant === "gradient"

  return (
    <section
      className={cn(
        "py-20 md:py-32 relative overflow-hidden",
        className
      )}
    >
      {/* Solid gradient background for premium variant */}
      {isPremium && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800" />
      )}

      {/* Non-premium background */}
      {!isPremium && (
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Gradient border card for premium variant */}
        {isPremium ? (
          <div className="relative max-w-4xl mx-auto">
            {/* Gradient border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-3xl blur-sm" />
            <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-400/50 via-primary-400/50 to-rose-400/50 rounded-3xl opacity-50" />

            {/* Content card */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-10 md:p-16 border border-white/20">
              <div className="text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span className="text-sm font-medium text-white/90">Get started for free</span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-white mb-6 leading-tight">
                  {title}
                </h2>
                <p className="text-lg md:text-xl font-instrument-sans text-white/80 mb-10 max-w-2xl mx-auto">
                  {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href={ctaLink}>
                    <Button className="bg-white text-primary-700 hover:bg-white/90 border-0 shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all duration-300 px-8 py-6 text-base font-semibold">
                      {ctaText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  {secondaryCtaText && secondaryCtaLink && (
                    <Link href={secondaryCtaLink}>
                      <Button
                        variant="outline"
                        className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base transition-all duration-300"
                      >
                        {secondaryCtaText}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default variant */
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-instrument-serif font-normal text-neutral-900 mb-4">
              {title}
            </h2>
            <p className="text-lg font-instrument-sans text-neutral-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ctaLink}>
                <Button className="bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-smooth px-8 py-6 text-base">
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {secondaryCtaText && secondaryCtaLink && (
                <Link href={secondaryCtaLink}>
                  <Button
                    variant="outline"
                    className="px-8 py-6 text-base"
                  >
                    {secondaryCtaText}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
