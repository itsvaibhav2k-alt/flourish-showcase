import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

const values = [
  {
    number: "01",
    title: "Simplicity First",
    description:
      "Power doesn't have to mean complexity. We build tools that are intuitive from day one, so your team can focus on your mission instead of learning software.",
  },
  {
    number: "02",
    title: "Mission-Driven",
    description:
      "Every feature we build is guided by one question: does this help organizations do more good? We're not here to add bloat - we're here to amplify impact.",
  },
  {
    number: "03",
    title: "Accessible to All",
    description:
      "Enterprise-grade tools shouldn't require enterprise budgets. We believe every organization working to make the world better deserves the best technology.",
  },
]

const organizationTypes = [
  "Nonprofits",
  "Charities",
  "Churches",
  "Schools",
  "PTAs",
  "Foundations",
  "Community Groups",
  "Youth Organizations",
  "Animal Shelters",
  "Food Banks",
  "Environmental Groups",
  "Arts Organizations",
  "Health Initiatives",
  "Sports Clubs",
  "Civic Associations",
  "Alumni Groups",
]

// Featured testimonial
const featuredTestimonial = {
  quote:
    "Flourish has transformed how we manage our donor relationships. The AI features save us hours every week, and our team actually enjoys using it.",
  author: "Benjamin Blakley",
  role: "Executive Director",
  organization: "The Family One",
}

// Organization pill badge component
function OrganizationPill({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center px-5 py-2.5 rounded-full bg-white border border-neutral-200/80 text-sm font-medium text-neutral-700 whitespace-nowrap shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-300"
    >
      {name}
    </span>
  )
}

// Numbered Value Card component with large floating numbers
function NumberedValue({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="relative group">
      {/* Large decorative number */}
      <span
        className="absolute -top-4 -left-4 md:-left-8 font-instrument-serif text-[80px] md:text-[100px] font-normal leading-none select-none pointer-events-none transition-all duration-500 text-primary-100 group-hover:text-primary-200"
      >
        {number}
      </span>

      {/* Content card */}
      <div className="relative z-10 pt-16 md:pt-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200/60 p-8 md:p-10 shadow-card hover:shadow-card-hover transition-all duration-300">
          <h3 className="text-2xl md:text-3xl font-instrument-serif font-normal text-neutral-900 mb-4">
            {title}
          </h3>
          <p className="text-lg text-neutral-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <>
      {/* Hero Section - Large statement, no eyebrow */}
      <section className="pt-16 pb-8 md:pt-20 md:pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-instrument-serif font-normal text-neutral-900 leading-[1.1] mb-6 animate-appear opacity-0">
              We believe every{" "}
              <span className="italic text-gradient-primary">
                mission-driven organization
              </span>{" "}
              deserves powerful tools.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-3xl animate-appear opacity-0 delay-300">
              Not just the ones with enterprise budgets.
            </p>
          </div>
        </div>
      </section>

      {/* Mission/Vision - Asymmetric side-by-side cards */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Mission - Larger card */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-neutral-200/60 p-8 md:p-12 shadow-card h-full">
                <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-primary-100 text-primary-700 rounded-full mb-6">
                  Our Mission
                </span>
                <h2 className="text-3xl md:text-4xl font-instrument-serif font-normal text-neutral-900 mb-6 leading-tight">
                  To democratize nonprofit technology
                </h2>
                <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                  We know that small and mid-sized organizations often struggle with the same challenges: scattered data, time-consuming administrative tasks, and limited resources.
                </p>
                <p className="text-lg text-neutral-600 leading-relaxed">
                  Flourish was built to solve these problems - bringing AI-powered tools that were once only available to large organizations with big budgets to everyone working to make a difference.
                </p>
              </div>
            </div>

            {/* Vision - Smaller card with gradient */}
            <div className="lg:col-span-5 lg:mt-12">
              <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-white/20 text-white rounded-full mb-6">
                    Our Vision
                  </span>
                  <h3 className="text-2xl md:text-3xl font-instrument-serif font-normal mb-4 leading-tight">
                    A world where every organization working for good has the tools to succeed
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Regardless of their size, budget, or technical expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Numbered, centered layout */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-primary-100 text-primary-700 rounded-full mb-4">
              What we believe
            </span>
            <h2 className="text-2xl md:text-3xl font-instrument-serif font-normal text-neutral-900">
              Principles that guide everything we build
            </h2>
          </div>

          <div className="space-y-16 md:space-y-20 max-w-3xl mx-auto pl-8 md:pl-12">
            {values.map((value, index) => (
              <NumberedValue
                key={index}
                number={value.number}
                title={value.title}
                description={value.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve - Static grid of organization types */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-teal-100 text-teal-700 rounded-full mb-4">
              Who we serve
            </span>
            <h2 className="text-3xl md:text-4xl font-instrument-serif font-normal text-neutral-900 mb-4">
              Built for organizations of all types
            </h2>
            <p className="text-lg text-neutral-600">
              If you&apos;re building relationships to achieve your mission, Flourish is for you.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {organizationTypes.map((type, i) => (
              <OrganizationPill key={i} name={type} />
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Team CTA (replaces hidden team section) */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-amber-100 text-amber-700 rounded-full mb-4">
              Join Us
            </span>
            <h2 className="text-2xl md:text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
              Help us build the future of nonprofit technology
            </h2>
            <p className="text-neutral-600 mb-6">
              We&apos;re a small, passionate team dedicated to helping mission-driven organizations thrive. If that sounds like work you&apos;d love, we&apos;d love to hear from you.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="px-5 py-2.5">
                Get in touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Testimonial - Single large quote */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Large quote mark */}
            <div className="mb-6">
              <svg
                className="w-12 h-12 md:w-16 md:h-16 text-primary-200"
                fill="currentColor"
                viewBox="0 0 32 32"
              >
                <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
              </svg>
            </div>

            {/* Quote */}
            <blockquote className="mb-8">
              <p className="text-2xl md:text-3xl lg:text-4xl font-instrument-serif font-normal text-neutral-900 leading-snug">
                {featuredTestimonial.quote}
              </p>
            </blockquote>

            {/* Attribution */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {featuredTestimonial.author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">
                  {featuredTestimonial.author}
                </p>
                <p className="text-neutral-600 text-sm">
                  {featuredTestimonial.role}, {featuredTestimonial.organization}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA - Purple Gradient Card */}
      <section className="py-12 md:py-16 bg-neutral-50">
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
                    <span className="text-sm font-medium">Join our journey</span>
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
                    <ArrowRight className="ml-2 h-4 w-4" />
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
