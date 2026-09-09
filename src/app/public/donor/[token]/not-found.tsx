export default function DonorPortalNotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Portal Link Not Found</h1>
          <p className="text-neutral-600">
            This donor portal link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-4 text-sm text-neutral-600">
          <p>
            If you believe this is an error, please contact the organization directly for
            assistance.
          </p>
          <p>
            They can generate a new portal link for you to access your donor information.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-500">
            Secure donor portal for managing your information
          </p>
        </div>
      </div>
    </div>
  )
}
