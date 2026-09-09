/**
 * Story Card Component
 *
 * Display an impact story with share button
 */

'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share2, Mail, Eye, ExternalLink, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { sendStory } from '../actions'
import type { ImpactStory } from '../schemas'

interface StoryCardProps {
  story: ImpactStory & {
    contact?: {
      first_name: string
      last_name: string
      email: string
    }
  }
}

export function StoryCard({ story }: StoryCardProps) {
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareUrl = `${baseUrl}/impact/${story.share_token}`

  const handleSendEmail = async () => {
    if (!story.contact?.email) {
      toast.error('No email address available for this contact')
      return
    }

    if (
      !window.confirm(
        `Send this impact story to ${story.contact.first_name} ${story.contact.last_name} at ${story.contact.email}?`
      )
    ) {
      return
    }

    setIsSending(true)
    const result = await sendStory({ story_id: story.id! })
    setIsSending(false)

    if (result.success) {
      toast.success('Impact story sent successfully!')
    } else {
      toast.error(result.error || 'Failed to send story')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const contactName = story.contact
    ? `${story.contact.first_name} ${story.contact.last_name}`
    : 'Unknown Contact'

  const formattedDate = new Date(story.created_at || '').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="shadow-card border-neutral-200/60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{story.title}</CardTitle>
            <CardDescription className="mt-1">
              For {contactName} • Created {formattedDate}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {story.sent_at && (
              <Badge variant="secondary">
                <Mail className="w-3 h-3 mr-1" />
                Sent
              </Badge>
            )}
            {story.view_count && story.view_count > 0 && (
              <Badge variant="secondary">
                <Eye className="w-3 h-3 mr-1" />
                {story.view_count} {story.view_count === 1 ? 'view' : 'views'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <div className="font-medium text-neutral-700 mb-1">Impact Summary:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(story.metrics as Record<string, number>).map(
                ([key, value]) => (
                  <Badge key={key} variant="outline">
                    {value.toLocaleString()} {key.replace(/_/g, ' ')}
                  </Badge>
                )
              )}
            </div>
          </div>

          <div className="text-sm">
            <div className="font-medium text-neutral-700 mb-1">Total Giving:</div>
            <div className="text-lg font-semibold text-emerald-600">
              ${Number(story.total_giving).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {(story.period_start || story.period_end) && (
            <div className="text-xs text-neutral-500">
              Period: {story.period_start || 'Beginning'} to{' '}
              {story.period_end || 'Present'}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy Link
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareUrl, '_blank')}
          className="flex-1"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSendEmail}
          disabled={isSending || !story.contact?.email}
          className="flex-1"
        >
          {isSending ? (
            <>Sending...</>
          ) : (
            <>
              <Mail className="w-3 h-3 mr-1" />
              Email
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
