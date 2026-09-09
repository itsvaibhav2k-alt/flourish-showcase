import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  },
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 bg-neutral-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo and tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Flourish"
                width={120}
                height={30}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-neutral-400 text-sm font-light leading-relaxed">
              AI-powered CRM for mission-driven organizations
            </p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-4">
              {footerLinks.product.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-4">
              {footerLinks.company.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-4">
              {footerLinks.legal.title}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-smooth"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} Flourish. All rights reserved.
            </p>
            <p className="text-sm text-neutral-500">
              Made with care for organizations that care
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
