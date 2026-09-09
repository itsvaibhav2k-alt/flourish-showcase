/**
 * Not Found Page for Impact Stories
 */

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Story Not Found
        </h1>
        <p className="text-neutral-600 mb-6">
          This impact story could not be found. It may have been removed or the link
          may be incorrect.
        </p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}
