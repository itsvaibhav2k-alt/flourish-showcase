import { Suspense } from 'react'
import { AskFloraPage } from '@/modules/ask-flora'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ask Flora | Natural Language Queries',
  description: 'Query your nonprofit data using natural language',
}

export default function FloraAskPage() {
  return (
    <Suspense fallback={<AskFloraLoading />}>
      <AskFloraPage />
    </Suspense>
  )
}

function AskFloraLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="h-[400px] bg-gray-100 rounded-xl" />
    </div>
  )
}
