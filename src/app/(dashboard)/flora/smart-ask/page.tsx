import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SmartAskPage } from '@/modules/smart-ask'
import { getCurrentOrganizationId } from '@/lib/auth/organization'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Smart Ask | Flora',
  description: 'AI-optimized donation amount suggestions',
}

export default async function FloraSmartAskPage() {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<SmartAskLoading />}>
      <SmartAskPage />
    </Suspense>
  )
}

function SmartAskLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-[500px] bg-gray-100 rounded-xl" />
        <div className="h-[500px] bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}
