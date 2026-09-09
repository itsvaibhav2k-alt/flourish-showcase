import { Suspense } from 'react'
import { GrantWriterPage } from '@/modules/grant-writing'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI Grant Writer | Flora',
  description: 'Generate grant proposals using AI with your organization data',
}

export default function FloraGrantsPage() {
  return (
    <Suspense fallback={<GrantWriterLoading />}>
      <GrantWriterPage />
    </Suspense>
  )
}

function GrantWriterLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-[600px] bg-gray-100 rounded-xl" />
        <div className="h-[600px] bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}
