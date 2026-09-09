import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Clean branding panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-white overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-100/60 via-violet-50/40 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-50/50 via-primary-50/30 to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo and back link */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo.png"
                alt="Flourish"
                width={180}
                height={46}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>

          {/* Main headline - Claude inspired */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <h1 className="text-5xl xl:text-6xl font-instrument-serif font-normal text-neutral-900 leading-[1.1] mb-6">
              Your mission,
              <br />
              <span className="italic text-gradient-primary">amplified.</span>
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed">
              AI-powered CRM for nonprofits and mission-driven organizations.
            </p>
          </div>

          {/* Footer quote */}
          <div className="pt-8">
            <p className="text-sm text-neutral-400">
              Trusted by organizations building stronger communities.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col min-h-screen bg-neutral-50 relative">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-neutral-100">
          <div className="px-4 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Flourish"
                width={140}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 px-6">
          <div className="text-center text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Flourish. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
