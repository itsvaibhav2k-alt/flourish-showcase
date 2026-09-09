'use client'

/**
 * Generate Email Button
 *
 * Allows users to manually trigger AI email generation for a contact.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { generateDraft, type EmailType } from '@/modules/communications/actions/generate-draft'
import { toast } from 'sonner'

interface GenerateEmailButtonProps {
  contactId: string
  organizationId: string
  isDonor?: boolean
  isVolunteer?: boolean
  latestGiftId?: string | null
  latestShiftId?: string | null
}

export function GenerateEmailButton({
  contactId,
  organizationId,
  isDonor = false,
  isVolunteer = false,
  latestGiftId,
  latestShiftId,
}: GenerateEmailButtonProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatingType, setGeneratingType] = React.useState<string | null>(null)

  const handleGenerate = async (emailType: EmailType, context?: Record<string, unknown>) => {
    setIsGenerating(true)
    setGeneratingType(emailType)

    try {
      const result = await generateDraft({
        organizationId,
        contactId,
        emailType,
        context: context as { giftId?: string; shiftId?: string },
      })

      if (result.success) {
        toast.success('Email draft generated!', {
          description: result.usedFallback
            ? 'Using template (AI unavailable)'
            : 'AI-powered draft ready for review',
          action: {
            label: 'Review',
            onClick: () => router.push('/communications/review'),
          },
        })
        router.refresh()
      } else {
        toast.error('Failed to generate email', {
          description: result.error || 'Please try again',
        })
      }
    } catch (error) {
      console.error('Generate email error:', error)
      toast.error('Failed to generate email', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }

  // If neither donor nor volunteer, show disabled state
  if (!isDonor && !isVolunteer) {
    return (
      <Button variant="outline" disabled>
        <Mail className="mr-2 h-4 w-4" />
        Generate Email
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4 text-violet-600" />
          )}
          {isGenerating ? `Generating ${generatingType}...` : 'Generate Email'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isDonor && (
          <>
            <DropdownMenuItem
              onClick={() =>
                handleGenerate('thank_you', { giftId: latestGiftId })
              }
              disabled={!latestGiftId || isGenerating}
            >
              <Mail className="mr-2 h-4 w-4" />
              Thank You Email
              {!latestGiftId && (
                <span className="ml-auto text-xs text-neutral-400">No gift</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleGenerate('reengagement')}
              disabled={isGenerating}
            >
              <Mail className="mr-2 h-4 w-4" />
              Re-engagement Email
            </DropdownMenuItem>
          </>
        )}
        {isVolunteer && (
          <>
            <DropdownMenuItem
              onClick={() =>
                handleGenerate('volunteer_confirmation', { shiftId: latestShiftId })
              }
              disabled={!latestShiftId || isGenerating}
            >
              <Mail className="mr-2 h-4 w-4" />
              Shift Confirmation
              {!latestShiftId && (
                <span className="ml-auto text-xs text-neutral-400">No shift</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleGenerate('volunteer_thank_you')}
              disabled={isGenerating}
            >
              <Mail className="mr-2 h-4 w-4" />
              Volunteer Thank You
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
