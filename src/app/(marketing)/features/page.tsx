"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Heart,
  TrendingDown,
  Gift,
  Users,
  CalendarDays,
  Bell,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Search,
  BarChart3,
  Shield,
  Database,
  Import,
  ArrowRight,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// INLINE COMPONENT: WordReveal - Animated word reveal for hero
// ============================================================================
function WordReveal({
  words,
  className
}: {
  words: string[]
  className?: string
}) {
  return (
    <span className={cn("inline-flex flex-wrap gap-x-3", className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className="animate-appear opacity-0 italic text-gradient-primary"
          style={{ animationDelay: `${300 + index * 150}ms` }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}

// ============================================================================
// INLINE COMPONENT: FeatureShowcase - Asymmetric left/right layout
// ============================================================================
interface ShowcaseFeature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function FeatureShowcase({
  eyebrow,
  title,
  description,
  features,
  reversed = false,
}: {
  eyebrow: string
  title: string
  description: string
  features: ShowcaseFeature[]
  reversed?: boolean
}) {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center",
      reversed && "lg:grid-flow-dense"
    )}>
      {/* Text content */}
      <div className={cn(reversed && "lg:col-start-2")}>
        <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
          {eyebrow}
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 mb-6">
          {title}
        </h2>
        <p className="text-lg font-instrument-sans text-neutral-600 leading-relaxed mb-10">
          {description}
        </p>

        {/* Feature list */}
        <div className="space-y-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center transition-all duration-300">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-instrument-sans text-neutral-900 mb-1 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-instrument-sans text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Visual placeholder */}
      <div className={cn(
        "relative",
        reversed && "lg:col-start-1"
      )}>
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary-50 via-white to-violet-50 border border-primary-200/60 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Floating cards preview */}
          <div className="absolute top-8 left-8 right-8 bottom-8">
            <div className="absolute top-0 left-0 w-3/4 bg-white rounded-xl shadow-lg shadow-primary-500/10 p-4 border border-neutral-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-200" />
                <div>
                  <div className="h-3 w-24 bg-neutral-200 rounded" />
                  <div className="h-2 w-16 bg-neutral-100 rounded mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-neutral-100 rounded" />
                <div className="h-2 w-4/5 bg-neutral-100 rounded" />
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-2/3 bg-white rounded-xl shadow-lg shadow-teal-500/10 p-4 border border-neutral-100">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 bg-teal-100 rounded" />
                <div className="h-6 w-6 rounded-full bg-primary-200" />
              </div>
              <div className="h-16 bg-neutral-100 rounded-lg" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INLINE COMPONENT: HorizontalScroll - Scrolling feature cards
// ============================================================================
interface ScrollFeature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: "purple" | "teal" | "amber" | "rose"
}

const colorStyles = {
  purple: {
    bg: "bg-gradient-to-br from-primary-50 to-violet-50",
    icon: "bg-gradient-to-br from-primary-500 to-violet-600",
    border: "border-primary-200/60",
    hover: "hover:border-primary-300",
  },
  teal: {
    bg: "bg-gradient-to-br from-teal-50 to-cyan-50",
    icon: "bg-gradient-to-br from-teal-500 to-cyan-600",
    border: "border-teal-200/60",
    hover: "hover:border-teal-300",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    icon: "bg-gradient-to-br from-amber-500 to-orange-500",
    border: "border-amber-200/60",
    hover: "hover:border-amber-300",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    icon: "bg-gradient-to-br from-rose-500 to-pink-500",
    border: "border-rose-200/60",
    hover: "hover:border-rose-300",
  },
}

function HorizontalScrollFeatures({
  eyebrow,
  title,
  description,
  features,
}: {
  eyebrow: string
  title: string
  description: string
  features: ScrollFeature[]
}) {
  return (
    <div>
      {/* Header - left aligned */}
      <div className="mb-12">
        <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
          {eyebrow}
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 max-w-2xl">
            {title}
          </h2>
          <p className="text-lg font-instrument-sans text-neutral-600 leading-relaxed max-w-md lg:text-right">
            {description}
          </p>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const colors = colorStyles[feature.color]

            return (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 w-[280px] sm:w-[320px] snap-start",
                  "group relative rounded-2xl border backdrop-blur-sm p-6",
                  "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                  colors.bg,
                  colors.border,
                  colors.hover
                )}
              >
                {/* Number badge */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center border border-neutral-200/60">
                  <span className="text-sm font-semibold text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-lg",
                  "transition-all duration-300",
                  colors.icon
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold font-instrument-sans text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm font-instrument-sans text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Scroll indicators */}
        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {features.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-neutral-300"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INLINE COMPONENT: NumberedValues - Staggered numbered list
// ============================================================================
interface NumberedItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function NumberedValues({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string
  title: string
  description: string
  items: NumberedItem[]
}) {
  return (
    <div>
      {/* Centered header */}
      <div className="text-center mb-16">
        <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
          {eyebrow}
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
          {title}
        </h2>
        <p className="text-lg font-instrument-sans text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Staggered numbered items */}
      <div className="max-w-4xl mx-auto">
        {items.map((item, index) => {
          const Icon = item.icon
          const isEven = index % 2 === 0

          return (
            <div
              key={index}
              className={cn(
                "relative flex items-start gap-8 py-8",
                index !== items.length - 1 && "border-b border-neutral-200/60",
                isEven ? "lg:pr-24" : "lg:pl-24"
              )}
            >
              {/* Large number */}
              <div className="flex-shrink-0 w-20">
                <span className="text-6xl md:text-7xl font-instrument-serif font-light text-primary-200 leading-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-instrument-sans text-neutral-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="font-instrument-sans text-neutral-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// INLINE COMPONENT: SimpleCTA - Contextual inline CTA
// ============================================================================
function SimpleCTA({
  title,
  description,
  primaryText,
  primaryLink,
  secondaryText,
  secondaryLink,
}: {
  title: string
  description: string
  primaryText: string
  primaryLink: string
  secondaryText?: string
  secondaryLink?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 p-10 md:p-16">
      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-4">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span className="text-sm font-medium text-white/90">Powered by AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-instrument-serif font-normal text-white mb-4">
            {title}
          </h2>
          <p className="text-lg font-instrument-sans text-white/80">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={primaryLink}>
            <Button className="bg-white text-primary-700 hover:bg-white/90 border-0 shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all duration-300 px-8 py-6 text-base font-semibold">
              {primaryText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          {secondaryText && secondaryLink && (
            <Link href={secondaryLink}>
              <Button
                variant="outline"
                className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base transition-all duration-300"
              >
                {secondaryText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DATA
// ============================================================================

const donorFeatures: ShowcaseFeature[] = [
  {
    icon: Gift,
    title: "Gift Tracking",
    description:
      "Record and track every donation with comprehensive history, including amounts, dates, campaigns, and payment methods.",
  },
  {
    icon: TrendingDown,
    title: "Lapse Risk Detection",
    description:
      "AI-powered analysis identifies donors at risk of lapsing so you can proactively re-engage them.",
  },
  {
    icon: Heart,
    title: "Impact Stories",
    description:
      "Create shareable impact pages that show donors exactly how their contributions make a difference.",
  },
  {
    icon: BarChart3,
    title: "Donor Pipeline",
    description:
      "Visual pipeline to track prospects from first contact to loyal supporter with stage-based management.",
  },
]

const volunteerFeatures: ScrollFeature[] = [
  {
    icon: CalendarDays,
    title: "Shift Scheduling",
    description:
      "Create and manage volunteer shifts with flexible recurring schedules and capacity limits.",
    color: "purple",
  },
  {
    icon: Users,
    title: "Public Signup Pages",
    description:
      "Beautiful, shareable pages where volunteers can browse and sign up for available shifts.",
    color: "teal",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description:
      "Automatic email and SMS reminders ensure volunteers never miss their scheduled shifts.",
    color: "amber",
  },
  {
    icon: CheckCircle,
    title: "Check-in System",
    description:
      "Easy check-in/check-out tracking to monitor attendance and calculate volunteer hours.",
    color: "rose",
  },
]

const floraFeatures = [
  {
    icon: MessageSquare,
    title: "AI Communications",
    description:
      "Generate personalized thank-you emails that sound like you wrote them, not a robot.",
    colors: {
      bg: "bg-gradient-to-br from-primary-50 via-white to-violet-50/50",
      icon: "bg-gradient-to-br from-primary-500 to-violet-600",
      border: "border-primary-200/60",
      shadow: "shadow-primary-500/25",
      hover: "hover:text-primary-700",
    },
  },
  {
    icon: Search,
    title: "Ask Anything",
    description:
      "Query your data in plain English: 'Who are my top donors this quarter?'",
    colors: {
      bg: "bg-gradient-to-br from-teal-50 via-white to-cyan-50/50",
      icon: "bg-gradient-to-br from-teal-500 to-cyan-600",
      border: "border-teal-200/60",
      shadow: "shadow-teal-500/25",
      hover: "hover:text-teal-700",
    },
  },
  {
    icon: Sparkles,
    title: "Smart Insights",
    description:
      "Get AI-powered recommendations to improve donor retention and engagement.",
    colors: {
      bg: "bg-gradient-to-br from-amber-50 via-white to-orange-50/50",
      icon: "bg-gradient-to-br from-amber-500 to-orange-500",
      border: "border-amber-200/60",
      shadow: "shadow-amber-500/25",
      hover: "hover:text-amber-700",
    },
  },
  {
    icon: BarChart3,
    title: "Instant Reports",
    description:
      "Generate summaries and reports about your organization's performance on demand.",
    colors: {
      bg: "bg-gradient-to-br from-rose-50 via-white to-pink-50/50",
      icon: "bg-gradient-to-br from-rose-500 to-pink-500",
      border: "border-rose-200/60",
      shadow: "shadow-rose-500/25",
      hover: "hover:text-rose-700",
    },
  },
]

const platformFeatures: NumberedItem[] = [
  {
    icon: Import,
    title: "Easy Data Import",
    description:
      "Import your existing contacts from CSV files with intelligent field mapping and duplicate detection. Switch from spreadsheets or other CRMs in minutes.",
  },
  {
    icon: Database,
    title: "Unified Contact Database",
    description:
      "One central place for all your contacts - donors, volunteers, board members, and more. See complete interaction history at a glance.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption, role-based access controls, and SOC 2 compliant infrastructure. Your data is safe with us.",
  },
]

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function FeaturesPage() {
  return (
    <>
      {/* ================================================================== */}
      {/* HERO SECTION - with animated word reveal */}
      {/* ================================================================== */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-6 animate-appear opacity-0">
              Features
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-instrument-serif font-normal text-neutral-900 mb-8 leading-[1.15]">
              <span className="animate-appear opacity-0">Everything you need to</span>
              <br />
              <WordReveal words={["grow", "engage", "thrive"]} />
            </h1>
            <p className="text-xl font-instrument-sans text-neutral-600 leading-relaxed animate-appear opacity-0 delay-300 max-w-2xl mx-auto">
              Powerful tools designed specifically for mission-driven
              organizations. From donor management to AI communications, we have
              got you covered.
            </p>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-3 mt-10 animate-appear opacity-0 delay-300">
              {[
                { label: "Donor Management", href: "#donors" },
                { label: "Volunteers", href: "#volunteers" },
                { label: "Flora AI", href: "#flora" },
                { label: "Platform", href: "#platform" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* DONOR MANAGEMENT - Asymmetric showcase layout */}
      {/* ================================================================== */}
      <section id="donors" className="py-20 md:py-32 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FeatureShowcase
            eyebrow="Donor Management"
            title="Build lasting relationships with your supporters"
            description="Track every gift, identify at-risk donors, and show the impact of their generosity. Turn one-time donors into lifelong champions of your cause."
            features={donorFeatures}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* VOLUNTEER COORDINATION - Horizontal scrolling cards */}
      {/* ================================================================== */}
      <section id="volunteers" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <HorizontalScrollFeatures
            eyebrow="Volunteer Coordination"
            title="Effortless volunteer management"
            description="Schedule shifts, send reminders, and track hours without the spreadsheet headaches."
            features={volunteerFeatures}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* FLORA AI - Custom 2x2 grid (preserved as is - already unique) */}
      {/* ================================================================== */}
      <section id="flora" className="py-20 md:py-32 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered header with Flora branding */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-violet-100 border border-primary-200/60 mb-6">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Powered by Claude</span>
            </div>
            <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
              Meet Flora
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
              Your AI-powered{" "}
              <span className="italic text-gradient-primary">assistant</span>
            </h2>
            <p className="text-lg font-instrument-sans text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              From personalized communications to instant data insights, Flora
              handles the busywork so you can focus on your mission.
            </p>
          </div>

          {/* 2x2 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {floraFeatures.map((feature, index) => {
              const Icon = feature.icon
              const colors = feature.colors

              return (
                <div
                  key={index}
                  className={cn(
                    "group relative p-6 rounded-2xl backdrop-blur-sm border",
                    "hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
                    colors.bg,
                    colors.border
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg",
                      "transition-all duration-300",
                      colors.icon,
                      colors.shadow
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Text */}
                  <h3
                    className={cn(
                      "text-lg font-semibold font-instrument-sans text-neutral-900 mb-2 transition-colors",
                      colors.hover
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm font-instrument-sans text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* PLATFORM - Numbered list format */}
      {/* ================================================================== */}
      <section id="platform" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <NumberedValues
            eyebrow="Platform"
            title="Built for organizations of any size"
            description="Enterprise-grade features with simplicity that small teams can embrace. Start free, scale infinitely."
            items={platformFeatures}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* CTA - Contextual "Try Flora" inline */}
      {/* ================================================================== */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SimpleCTA
            title="Ready to meet Flora?"
            description="Start your free trial today and discover how AI can transform your nonprofit operations."
            primaryText="Try Flora free"
            primaryLink="/signup"
            secondaryText="Talk to sales"
            secondaryLink="/contact"
          />
        </div>
      </section>
    </>
  )
}
