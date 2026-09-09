'use client'

import { DonorInfoForm } from './donor-info-form'
import { GiftHistoryTable } from './gift-history-table'
import type { DonorPortalData } from '@/modules/donors/queries/get-donor-by-token'

interface DonorPortalProps {
  data: DonorPortalData
  token: string
  onUpdate?: () => void
}

export function DonorPortal({ data, token, onUpdate }: DonorPortalProps) {
  const { contact, gifts, organization } = data

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900">{organization.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">Donor Portal</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Welcome, {contact.first_name}!
            </h2>
            <p className="mt-2 text-neutral-600">
              Thank you for your generous support. Use this portal to view your giving history
              and keep your contact information up to date.
            </p>
          </div>

          {/* Contact Info Form */}
          <DonorInfoForm contact={contact} token={token} onUpdateSuccess={onUpdate} />

          {/* Gift History */}
          <GiftHistoryTable gifts={gifts} />

          {/* Footer Note */}
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">
              If you have any questions or need assistance, please contact us directly.
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              This is a secure portal. Keep your link private.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
