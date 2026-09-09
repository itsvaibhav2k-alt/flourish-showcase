import { Metadata } from "next"
import Link from "next/link"
import { FAQAccordion } from "@/components/marketing"
import { Sparkles, Check, Gift, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing - Flourish",
  description:
    "Flourish is free during beta. Get early access to all features and lock in founding member benefits.",
}

const betaFeatures = [
  "Unlimited contacts",
  "AI-powered communications",
  "Donor management & lapse detection",
  "Volunteer scheduling & check-in",
  "Flora AI assistant",
  "Email support",
  "All future features",
]

const comingTiers = [
  {
    name: "Starter",
    audience: "Small organizations",
    features: ["Up to 500 contacts", "Basic features", "Email support"],
  },
  {
    name: "Growth",
    audience: "Growing nonprofits",
    features: ["Up to 5,000 contacts", "AI communications", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    audience: "Large organizations",
    features: ["Unlimited contacts", "API access", "Dedicated manager"],
  },
]

const faqItems = [
  {
    question: "Is Flourish really free during the beta?",
    answer:
      "Yes! During our beta period, Flourish is completely free to use with full access to all features. We're focused on building the best possible product with feedback from early users like you.",
  },
  {
    question: "What happens when pricing launches?",
    answer:
      "Early adopter organizations that sign up during the beta will receive special pricing and benefits as a thank you for helping us improve Flourish. We'll give plenty of notice before any pricing changes.",
  },
  {
    question: "Is my data safe during the beta?",
    answer:
      "Absolutely. We use enterprise-grade security including bank-level encryption, secure authentication, and regular backups. Your data is protected with the same standards we'll use when we officially launch.",
  },
  {
    question: "Can I export my data if I decide to leave?",
    answer:
      "Yes, you own your data. You can export all your contacts, donations, and other information at any time in standard formats like CSV.",
  },
  {
    question: "Do you offer discounts for small nonprofits?",
    answer:
      "We're committed to making Flourish accessible to organizations of all sizes. When we launch pricing, we'll have options specifically designed for smaller nonprofits and community groups.",
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Beta Hero - Main Section */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-28 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-primary text-white rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Beta Program</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-instrument-serif font-normal text-neutral-900 mb-6 animate-appear opacity-0">
              Free while in{" "}
              <span className="italic text-gradient-primary">beta</span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed mb-8 max-w-2xl mx-auto animate-appear opacity-0 delay-100">
              Full access to every feature. No credit card required.
              Lock in founding member benefits before we launch.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-appear opacity-0 delay-100">
              <Link
                href="/signup"
                className="inline-flex items-center bg-gradient-primary text-white font-medium rounded-xl px-8 py-4 hover:opacity-90 transition-smooth shadow-lg shadow-primary-500/25"
              >
                Get started free
              </Link>
              <span className="text-neutral-500 text-sm">
                Join 50+ organizations already using Flourish
              </span>
            </div>
          </div>

          {/* Beta Features Card */}
          <div className="max-w-2xl mx-auto mt-16">
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-900">Everything included</h2>
                  <p className="text-sm text-neutral-500">No limits during beta</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {betaFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Coming Preview - Simplified */}
      <section className="py-16 md:py-20 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-neutral-500 text-sm mb-4">
              <Clock className="w-4 h-4" />
              <span>Coming after beta</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-instrument-serif text-neutral-900">
              Planned pricing tiers
            </h2>
            <p className="text-neutral-600 mt-2 max-w-lg mx-auto">
              We&apos;re still finalizing our pricing. Beta users will get early access and special rates.
            </p>
          </div>

          {/* Simplified Tier Preview */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`relative p-6 rounded-xl border ${
                    tier.highlighted
                      ? "border-primary-200 bg-primary-50/50"
                      : "border-neutral-200/60 bg-white"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-neutral-900 mb-1">{tier.name}</h3>
                  <p className="text-sm text-neutral-500 mb-4">{tier.audience}</p>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-neutral-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-neutral-500 mt-6">
              Pricing details will be announced closer to launch. Beta users will be notified first.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section - Cleaner */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-instrument-serif text-neutral-900 mb-3">
                Common questions
              </h2>
              <p className="text-neutral-600">
                Everything you need to know about our beta program
              </p>
            </div>

            <FAQAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* Footer CTA - Purple Gradient Card */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Purple gradient card with border */}
            <div className="relative rounded-3xl overflow-hidden border border-primary-400/30">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600" />

              {/* Content */}
              <div className="relative px-8 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left side - Text */}
                <div className="text-center md:text-left">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white rounded-full px-4 py-1.5 mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Free during beta</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-instrument-serif text-white mb-3">
                    Ready to get started?
                  </h2>
                  <p className="text-white/80 max-w-md">
                    Join organizations already using Flourish to strengthen their supporter relationships.
                  </p>
                </div>

                {/* Right side - Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center bg-white text-primary-600 font-medium rounded-xl px-6 py-3 hover:bg-white/90 transition-smooth shadow-lg"
                  >
                    Start free trial
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl px-6 py-3 hover:bg-white/20 transition-smooth border border-white/20"
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
