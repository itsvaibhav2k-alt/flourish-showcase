import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Donor Portal',
  description: 'Manage your donor information and view your giving history',
}

interface DonorPortalLayoutProps {
  children: React.ReactNode
}

export default function DonorPortalLayout({ children }: DonorPortalLayoutProps) {
  return children
}
