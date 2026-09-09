import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Volunteer Opportunities',
  description: 'Sign up to volunteer and make a difference in your community',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Simple header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600" />
              <span className="text-lg font-semibold text-neutral-900">
                Volunteer Portal
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-neutral-500">
              Powered by{' '}
              <span className="font-semibold text-neutral-700">Flourish</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
