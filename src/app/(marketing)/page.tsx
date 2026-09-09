"use client"

import Link from "next/link"
import { Hero } from "@/components/ui/hero"
import { BentoGridHomepage, SectionHeader, AnimatedStats } from "@/components/marketing"
import {
  Heart,
  Users,
  MessageSquare,
  Sparkles,
  TrendingUp,
  CalendarCheck,
  Shield,
} from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "Donor Management",
    description:
      "Track gifts, detect lapse risks, and build lasting relationships with your supporters.",
  },
  {
    icon: Users,
    title: "Volunteer Coordination",
    description:
      "Schedule shifts, send reminders, and manage check-ins with ease.",
  },
  {
    icon: MessageSquare,
    title: "Smart Communications",
    description:
      "AI-generated thank-you emails that sound like you, not a robot.",
  },
  {
    icon: Sparkles,
    title: "Flora AI Assistant",
    description:
      "Ask questions in plain English and get instant insights about your organization.",
  },
  {
    icon: TrendingUp,
    title: "Impact Tracking",
    description:
      "Show donors exactly how their contributions make a difference.",
  },
  {
    icon: Shield,
    title: "Data Security",
    description:
      "Enterprise-grade security to keep your supporter data safe and compliant.",
  },
]

const stats = [
  {
    value: "10x",
    numericValue: 10,
    suffix: "x",
    label: "Faster thank-you emails",
    description: "AI-powered communications sent in seconds, not hours",
    color: "purple" as const,
  },
  {
    value: "85%",
    numericValue: 85,
    suffix: "%",
    label: "Time saved on admin tasks",
    description: "Automate repetitive work and focus on your mission",
    color: "teal" as const,
  },
  {
    value: "2x",
    numericValue: 2,
    suffix: "x",
    label: "Donor retention improvement",
    description: "Keep supporters engaged with personalized outreach",
    color: "amber" as const,
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        eyebrow="AI-POWERED CRM FOR MISSION-DRIVEN ORGANIZATIONS"
        title={
          <>
            <span className="font-instrument-serif font-normal">Your </span>
            <span className="font-instrument-serif font-normal italic text-gradient-primary">
              AI operations{" "}
            </span>
            <span className="font-instrument-serif font-normal">team</span>
            <br />
            <span className="font-instrument-serif font-normal">is here</span>
          </>
        }
        subtitle="Donor retention. Volunteer scheduling. Smart communications. Zero manual work."
        ctaText="Start now"
        ctaLink="/signup"
        secondaryCtaText="See features"
        secondaryCtaLink="/features"
        mockupImage={{
          src: "/dashboard-preview.png",
          alt: "Flourish Dashboard - AI-powered CRM for mission-driven organizations",
          width: 3457,
          height: 1802,
        }}
      />

      {/* Stats Section */}
      <AnimatedStats stats={stats} className="relative z-10" />

      {/* Features Section */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Features"
            title="Everything you need to grow your impact"
            description="Powerful tools designed specifically for mission-driven organizations, from small community groups to established nonprofits."
            className="mb-12 md:mb-16"
          />

          <BentoGridHomepage items={features} />

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-smooth"
            >
              See all features
              <span className="ml-2">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 md:py-24 relative z-10 overflow-hidden bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Asymmetric layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left content */}
            <div className="lg:col-span-5">
              <span className="inline-block px-3 py-1.5 text-xs font-semibold tracking-wider uppercase bg-teal-100 text-teal-700 rounded-full mb-4">
                Built for you
              </span>
              <h2 className="text-3xl md:text-4xl font-instrument-serif font-normal text-neutral-900 mb-4 leading-tight">
                For organizations that{" "}
                <span className="italic text-gradient-primary">do more</span> with less
              </h2>
              <p className="text-lg text-neutral-600 mb-6">
                Whether you&apos;re a nonprofit, community group, religious organization, or any mission-driven team.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-smooth"
              >
                Learn more about who we serve
                <span className="ml-2">&rarr;</span>
              </Link>
            </div>

            {/* Right cards - 2x2 grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Heart,
                    title: "Nonprofits",
                    description: "501(c)(3)s, charities, and foundations",
                    bgColor: "bg-primary-600",
                  },
                  {
                    icon: Users,
                    title: "Community Groups",
                    description: "Neighborhood associations and local clubs",
                    bgColor: "bg-teal-600",
                  },
                  {
                    icon: CalendarCheck,
                    title: "Schools & PTAs",
                    description: "Parent organizations and school groups",
                    bgColor: "bg-amber-600",
                  },
                  {
                    icon: Shield,
                    title: "Religious Orgs",
                    description: "Churches, temples, and faith communities",
                    bgColor: "bg-rose-600",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group p-5 bg-white rounded-[16px] border border-neutral-200 shadow-card hover-lift hover:shadow-card-hover"
                  >
                    <div className={`w-10 h-10 rounded-[12px] ${item.bgColor} flex items-center justify-center mb-3 shadow-sm transition-transform duration-150 group-hover:scale-105`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Purple Gradient Card */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Purple gradient card with border */}
            <div className="relative rounded-[16px] overflow-hidden border border-primary-400/30">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600" />

              {/* Content */}
              <div className="relative px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left side - Text */}
                <div className="text-center md:text-left">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Free during beta</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-instrument-serif text-white mb-3">
                    Ready to grow your impact?
                  </h2>
                  <p className="text-white/80 max-w-md">
                    Join mission-driven organizations using Flourish to build stronger relationships with their supporters.
                  </p>
                </div>

                {/* Right side - Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center bg-white text-primary-600 font-medium rounded-[12px] px-6 py-3 hover:bg-neutral-50 transition-colors duration-150 shadow-sm"
                  >
                    Start free trial
                    <span className="ml-2">&rarr;</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center bg-white/10 text-white font-medium rounded-[12px] px-6 py-3 hover:bg-white/20 transition-colors duration-150 border border-white/20"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
