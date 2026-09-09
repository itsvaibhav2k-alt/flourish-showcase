import { Suspense } from 'react'
import { FloraEmailsPage } from '@/modules/flora-emails'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import { getRecentFloraDrafts } from '@/modules/flora-emails'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FloraComposePage() {
  const organizationId = await getCurrentOrganizationId()

  if (!organizationId) {
    redirect('/login')
  }

  const initialDrafts = await getRecentFloraDrafts()

  return (
    <Suspense fallback={<FloraComposeLoading />}>
      <FloraEmailsPage
        organizationId={organizationId}
        initialDrafts={initialDrafts}
      />
    </Suspense>
  )
}

function FloraComposeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
