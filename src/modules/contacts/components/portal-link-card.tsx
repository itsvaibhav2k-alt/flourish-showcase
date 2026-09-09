'use client'

import { useState } from 'react'
import { Link2, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generatePortalToken } from '@/modules/contacts/actions/generate-portal-token'

interface PortalLinkCardProps {
  contactId: string
  existingToken: string | null
}

export function PortalLinkCard({ contactId, existingToken }: PortalLinkCardProps) {
  const [token, setToken] = useState(existingToken)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In production, fail loudly if NEXT_PUBLIC_APP_URL is not set (empty string will cause visible broken URLs)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'))

  const portalUrl = token ? `${baseUrl}/public/donor/${token}` : null

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generatePortalToken(contactId)

      if (result.success && result.token) {
        setToken(result.token)
      } else {
        setError(result.error || 'Failed to generate portal link')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!portalUrl) return

    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Donor Portal Link
        </CardTitle>
        <CardDescription>
          Share a secure link for this donor to manage their information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {!token ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Generate a secure portal link for this donor. They will be able to:
            </p>
            <ul className="text-sm text-neutral-600 list-disc list-inside space-y-1 ml-2">
              <li>View their giving history (last 12 months)</li>
              <li>Update their contact information</li>
              <li>Keep their details current without contacting you</li>
            </ul>
            <Button onClick={handleGenerateLink} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Portal Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Portal URL</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm font-mono break-all">
                  {portalUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  title="Open in new tab"
                >
                  <a href={portalUrl || undefined} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900">
                <strong>Security Notice:</strong> This link is unique and provides access to this
                donor's information. Share it only via secure channels (email, etc.).
              </p>
            </div>

            <div className="text-xs text-neutral-500">
              <p>You can share this link via email or include it in thank-you letters.</p>
              <p className="mt-1">
                Suggested message: "Manage your donor information at [link]"
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
