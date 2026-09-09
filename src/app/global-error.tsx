'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Application Error</h1>
          <p className="text-neutral-600 mb-8 max-w-md">
            Something went wrong. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh page
          </button>
        </div>
      </body>
    </html>
  )
}
