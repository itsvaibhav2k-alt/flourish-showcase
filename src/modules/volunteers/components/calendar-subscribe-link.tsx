'use client'

import { useState } from 'react'
import { Copy, Check, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CalendarSubscribeLinkProps {
  organizationId: string
  organizationName: string
  compact?: boolean
}

/**
 * Component that displays a calendar subscription URL with copy functionality
 * Users can copy this URL to subscribe to all upcoming shifts in their calendar app
 */
export function CalendarSubscribeLink({
  organizationId,
  organizationName,
  compact = false,
}: CalendarSubscribeLinkProps) {
  const [copied, setCopied] = useState(false)

  // Generate the full subscription URL
  // In production, fail loudly if NEXT_PUBLIC_APP_URL is not set (empty string will cause visible broken URLs)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'))

  const subscribeUrl = `${baseUrl}/api/calendar/shifts/${organizationId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscribeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy URL
              </>
            )}
          </Button>
        </div>
        <div className="flex gap-2 text-xs">
          <a
            href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(subscribeUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:underline"
          >
            Google Calendar
          </a>
          <span className="text-neutral-300">·</span>
          <a
            href={subscribeUrl}
            download={`${organizationName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-shifts.ics`}
            className="text-violet-600 hover:underline"
          >
            Download ICS
          </a>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Subscribe to all upcoming volunteer shifts in your calendar app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={subscribeUrl}
            readOnly
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">How to subscribe:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Copy the URL above</li>
            <li>Open your calendar app (Google Calendar, Apple Calendar, Outlook, etc.)</li>
            <li>Look for &quot;Add calendar by URL&quot; or &quot;Subscribe to calendar&quot;</li>
            <li>Paste the URL and save</li>
          </ol>
          <p className="text-xs text-neutral-500 mt-3">
            Your calendar will automatically update with new shifts as they are added.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-sm">
          <p className="text-blue-900 font-medium mb-1">Quick Links:</p>
          <ul className="space-y-1 text-blue-700">
            <li>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(subscribeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Add to Google Calendar
              </a>
            </li>
            <li>
              <a
                href={subscribeUrl}
                download={`${organizationName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-shifts.ics`}
                className="hover:underline"
              >
                Download ICS file
              </a>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
