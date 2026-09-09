import { notFound } from 'next/navigation'
import { getDonorByToken } from '@/modules/donors/queries/get-donor-by-token'
import { DonorPortal } from '@/modules/donors/components/donor-portal'

interface DonorPortalPageProps {
  params: Promise<{ token: string }>
}

export default async function DonorPortalPage({ params }: DonorPortalPageProps) {
  const { token } = await params

  // Validate token format (should be 64-character hex string)
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    notFound()
  }

  // Fetch donor data by token
  const donorData = await getDonorByToken(token)

  if (!donorData) {
    notFound()
  }

  return <DonorPortal data={donorData} token={token} />
}

export const dynamic = 'force-dynamic'
