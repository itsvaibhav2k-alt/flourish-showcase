'use client'

/**
 * AI Suggestion Card
 *
 * Displays AI-powered next step suggestions for contact engagement.
 * Fetches suggestions asynchronously and provides action buttons based on suggestion type.
 */

import * as React from 'react'
import Link from 'next/link'
import { Bot, Mail, Phone, Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { suggestNextStep, type NextStepSuggestion } from '@/lib/ai/suggest-next-step'

interface AISuggestionCardProps {
  contactId: string
}

export function AISuggestionCard({ contactId }: AISuggestionCardProps) {
  const [suggestion, setSuggestion] = React.useState<NextStepSuggestion | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    async function fetchSuggestion() {
      try {
        setLoading(true)
        setError(false)
        const result = await suggestNextStep(contactId)
        setSuggestion(result)
      } catch (err) {
        console.error('Failed to fetch AI suggestion:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestion()
  }, [contactId])

  // Loading state
  if (loading) {
    return (
      <Card className="border-violet-200 bg-violet-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-violet-600" />
            AI Suggested Next Step
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error or no suggestion
  if (error || !suggestion) {
    return (
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-neutral-400" />
            AI Suggested Next Step
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            Unable to generate suggestion at this time.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Determine priority badge styling
  const priorityConfig = {
    high: { label: 'High Priority', className: 'bg-red-100 text-red-700 border-red-200' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Low Priority', className: 'bg-green-100 text-green-700 border-green-200' },
  }

  const priority = priorityConfig[suggestion.priority]

  // Determine action icon
  const ActionIcon = {
    email: Mail,
    call: Phone,
    meeting: Calendar,
    gift_follow_up: CheckCircle2,
    general: CheckCircle2,
  }[suggestion.actionType]

  // Render action button based on type
  const renderActionButton = () => {
    switch (suggestion.actionType) {
      case 'email':
        return (
          <Button asChild size="sm" className="w-full">
            <Link href={`/communications?contact=${contactId}`}>
              <Mail className="mr-2 h-4 w-4" />
              Draft Email
            </Link>
          </Button>
        )
      case 'call':
        return (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/contacts/${contactId}`}>
              <Phone className="mr-2 h-4 w-4" />
              Log Call
            </Link>
          </Button>
        )
      case 'meeting':
        return (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/contacts/${contactId}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Link>
          </Button>
        )
      case 'gift_follow_up':
        return (
          <Button asChild size="sm" className="w-full">
            <Link href={`/communications?contact=${contactId}&type=thank_you`}>
              <Mail className="mr-2 h-4 w-4" />
              Send Thank You
            </Link>
          </Button>
        )
      default:
        return (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/contacts/${contactId}`}>
              View Contact
            </Link>
          </Button>
        )
    }
  }

  return (
    <Card className="border-violet-200 bg-violet-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-violet-600" />
          AI Suggested Next Step
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Badge */}
        <div>
          <Badge variant="outline" className={priority.className}>
            {priority.label}
          </Badge>
        </div>

        {/* Suggested Action */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ActionIcon className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-neutral-900">
                {suggestion.action}
              </p>
              {suggestion.suggestedDate && (
                <p className="text-xs text-violet-600 mt-1">
                  Suggested: {new Date(suggestion.suggestedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-neutral-600 pl-7">
            {suggestion.reason}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {renderActionButton()}
        </div>

        {/* AI Attribution */}
        <p className="text-xs text-neutral-400 text-center">
          Powered by Claude AI
        </p>
      </CardContent>
    </Card>
  )
}
