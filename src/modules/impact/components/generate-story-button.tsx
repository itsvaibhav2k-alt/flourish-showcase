'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImpactStoryCard } from './impact-story-card'

interface ImpactMetric {
  type: string
  value: number
  label: string
  icon?: string
}

interface ImpactStory {
  headline: string
  narrative: string
  metrics: ImpactMetric[]
}

interface GenerateStoryButtonProps {
  donorId: string
  donorName: string
  totalDonation: number
  organizationName?: string
  onGenerate?: (donorId: string) => Promise<ImpactStory>
  variant?: 'default' | 'primary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/**
 * Button to trigger AI impact story generation for a donor
 * Shows loading state and displays result in a dialog
 */
export function GenerateStoryButton({
  donorId,
  donorName,
  totalDonation,
  organizationName = 'Our Organization',
  onGenerate,
  variant = 'primary',
  size = 'default',
  className,
}: GenerateStoryButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [story, setStory] = useState<ImpactStory | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!onGenerate) {
      // Mock data for demo
      setIsGenerating(true)
      setTimeout(() => {
        setStory({
          headline: `${donorName.split(' ')[0]}, You Changed 47 Lives`,
          narrative: `Your incredible generosity has created a ripple effect of hope throughout our community. Because of your support, families who were struggling now have access to nutritious meals, safe shelter, and educational opportunities. Every dollar you gave became a lifeline for someone in need.`,
          metrics: [
            {
              type: 'meals',
              value: 235,
              label: 'Meals Provided',
              icon: 'meals',
            },
            {
              type: 'families',
              value: 12,
              label: 'Families Housed',
              icon: 'families',
            },
            {
              type: 'children',
              value: 47,
              label: 'Children Helped',
              icon: 'users',
            },
          ],
        })
        setIsGenerating(false)
        setShowDialog(true)
        setError(null)
      }, 2000)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await onGenerate(donorId)
      setStory(result)
      setShowDialog(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate impact story')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant={variant}
        size={size}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Story...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Impact Story
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 mt-2">
          {error}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Impact Story Generated</DialogTitle>
            <DialogDescription>
              Here's a personalized impact story showing the difference this donor made
            </DialogDescription>
          </DialogHeader>

          {story && (
            <div className="mt-4">
              <ImpactStoryCard
                donorName={donorName}
                headline={story.headline}
                narrative={story.narrative}
                metrics={story.metrics}
                totalDonation={totalDonation}
                organizationName={organizationName}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
