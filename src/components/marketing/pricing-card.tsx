import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, Sparkles } from "lucide-react"
import Link from "next/link"

interface PricingCardProps {
  name: string
  description: string
  price: string
  priceNote?: string
  features: string[]
  ctaText: string
  ctaLink: string
  highlighted?: boolean
  badge?: string
  disabled?: boolean
}

export function PricingCard({
  name,
  description,
  price,
  priceNote,
  features,
  ctaText,
  ctaLink,
  highlighted = false,
  badge,
  disabled = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-3xl transition-all duration-500 ease-out",
        highlighted && "z-10"
      )}
    >

      {/* Card container */}
      <div
        className={cn(
          "relative flex flex-col h-full p-8 rounded-3xl border transition-all duration-500",
          highlighted
            ? "bg-white border-2 border-primary-300 shadow-2xl shadow-primary-500/20"
            : "bg-white border-neutral-200/60 shadow-xl shadow-neutral-900/5 hover:shadow-2xl hover:shadow-neutral-900/10 hover:border-neutral-300"
        )}
      >
        {/* Badge */}
        {badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold",
                "bg-gradient-to-r from-primary-600 to-violet-600 text-white",
                "shadow-lg shadow-primary-500/30",
                "border border-primary-400/20"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {badge}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className={cn("mb-6", badge && "mt-2")}>
            <h3
              className={cn(
                "text-xl font-semibold font-instrument-sans mb-2 transition-colors duration-300",
                highlighted ? "text-primary-900" : "text-neutral-900 group-hover:text-neutral-800"
              )}
            >
              {name}
            </h3>
            <p className="font-instrument-sans text-neutral-600 text-sm leading-relaxed">{description}</p>
          </div>

          {/* Price */}
          <div className="mb-8">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-4xl font-bold tracking-tight transition-all duration-300",
                  highlighted
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600"
                    : "text-neutral-900 group-hover:text-neutral-800"
                )}
              >
                {price}
              </span>
              {priceNote && (
                <span className="text-neutral-500 text-sm font-medium">{priceNote}</span>
              )}
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8 flex-grow">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-3 group/item"
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300",
                    highlighted
                      ? "bg-gradient-to-br from-primary-500 to-violet-500 shadow-sm shadow-primary-500/30"
                      : "bg-gradient-to-br from-teal-400 to-teal-500 shadow-sm shadow-teal-500/20 group-hover/item:shadow-teal-500/30"
                  )}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="font-instrument-sans text-neutral-700 text-sm leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="mt-auto">
            {disabled ? (
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 rounded-xl font-medium text-sm",
                  "bg-neutral-100/50 border-neutral-200/60 text-neutral-400",
                  "cursor-not-allowed"
                )}
                disabled
              >
                {ctaText}
              </Button>
            ) : (
              <Link href={ctaLink} className="block">
                <Button
                  className={cn(
                    "w-full h-12 rounded-xl font-medium text-sm transition-all duration-300",
                    highlighted
                      ? [
                          "bg-gradient-to-r from-primary-600 to-violet-600 text-white",
                          "shadow-lg shadow-primary-500/30",
                          "hover:shadow-xl hover:shadow-primary-500/40",
                          "border border-primary-500/20",
                        ]
                      : [
                          "bg-white border border-neutral-200/80 text-neutral-900",
                          "hover:bg-white hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/10",
                        ]
                  )}
                  variant={highlighted ? "default" : "outline"}
                >
                  {ctaText}
                </Button>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
