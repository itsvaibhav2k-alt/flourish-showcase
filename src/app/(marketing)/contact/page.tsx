import { Metadata } from "next"
import { ContactForm } from "./contact-form"
import { Mail, MessageSquare, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact - Flourish",
  description:
    "Get in touch with the Flourish team. We'd love to hear from you about your organization's needs.",
}

const contactInfo = [
  {
    icon: Mail,
    title: "Email us",
    description: "For general inquiries and support",
    value: "contactflourish909@gmail.com",
    href: "mailto:contactflourish909@gmail.com",
  },
  {
    icon: MessageSquare,
    title: "Sales questions",
    description: "Learn more about Flourish for your organization",
    value: "contactflourish909@gmail.com",
    href: "mailto:contactflourish909@gmail.com",
  },
  {
    icon: Clock,
    title: "Response time",
    description: "We typically respond within",
    value: "24-48 hours",
    href: null,
  },
]

export default function ContactPage() {
  return (
    <section className="min-h-[calc(100vh-80px)] py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column layout - items-stretch for equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 max-w-6xl mx-auto items-stretch">
          {/* Left column - Info (40%) */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Hero content */}
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-instrument-serif font-normal text-neutral-900 leading-tight animate-appear opacity-0">
                We&apos;d love to{" "}
                <span className="italic text-gradient-primary">
                  hear from you
                </span>
              </h1>
              <p className="text-lg text-neutral-600 leading-relaxed animate-appear opacity-0 delay-100">
                Have questions about Flourish? Curious how it can help your
                nonprofit thrive? Drop us a line and let&apos;s start a
                conversation.
              </p>
            </div>

            {/* Contact info cards - stacked vertically, flex-1 to fill space */}
            <div className="space-y-4 animate-appear opacity-0 delay-300 flex-1 flex flex-col justify-start">
              {contactInfo.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-100 hover:border-primary-100 hover:bg-white/80 transition-smooth group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-icon flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-smooth">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 text-sm mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-1">
                      {item.description}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-smooth"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-neutral-800 font-medium text-sm">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right column - Form (60%) */}
          <div className="lg:col-span-7 animate-appear opacity-0 delay-300 flex flex-col">
            <div className="flex-1 flex flex-col">
              {/* Form header */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-1">
                  Send us a message
                </h2>
                <p className="text-neutral-500 text-sm">
                  Fill out the form and we&apos;ll get back to you soon.
                </p>
              </div>

              {/* Form - no card wrapper, clean integration */}
              <ContactForm />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary-50/40 rounded-full blur-3xl"></div>
      </div>
    </section>
  )
}
