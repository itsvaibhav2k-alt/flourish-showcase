import type { Metadata } from 'next'
import { Heart, Lock, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Make a secure donation and support our mission',
}

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-teal-50">
      {/* Simple header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-neutral-900 block">
                  Donation Portal
                </span>
                <span className="text-xs text-neutral-500">
                  Powered by Flourish
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-teal-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-teal-600" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Trust message */}
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                Secure Donations
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your donation is processed securely through Stripe. We never see or store your payment details.
              </p>
            </div>

            {/* Tax deductible info */}
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                Tax Deductible
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your donation may be tax-deductible. You'll receive a receipt via email for your records.
              </p>
            </div>

            {/* Privacy */}
            <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                Your Privacy
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We respect your privacy and will never share your information with third parties.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-xs text-neutral-500">
              Powered by{' '}
              <span className="font-semibold text-primary-600">Flourish</span>
              {' '}&middot;{' '}
              Payments processed by{' '}
              <span className="font-semibold text-neutral-700">Stripe</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
