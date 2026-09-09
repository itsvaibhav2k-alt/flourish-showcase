import { Suspense } from 'react'
import { SequencesPage } from '@/modules/sequences'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Email Sequences | Flora',
  description: 'Create and manage automated email sequences and drip campaigns',
}

export default function FloraSequencesPage() {
  return (
    <Suspense fallback={<SequencesLoading />}>
      <SequencesPage />
    </Suspense>
  )
}

function SequencesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
