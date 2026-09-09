/**
 * Story Generator Component
 *
 * UI for generating impact stories for a specific contact
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Calendar } from 'lucide-react'
import { generateStory } from '../actions'

interface StoryGeneratorProps {
  organizationId: string
  contactId: string
  contactName: string
  trigger?: React.ReactNode
}

export function StoryGenerator({
  organizationId,
  contactId,
  contactName,
  trigger,
}: StoryGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedStory, setGeneratedStory] = useState<{
    title: string
    content: string
    shareUrl: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setGeneratedStory(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      contact_id: contactId,
      period_start: formData.get('period_start') as string,
      period_end: formData.get('period_end') as string,
    }

    const result = await generateStory(organizationId, data)

    setIsGenerating(false)

    if (result.success && result.title && result.content && result.shareUrl) {
      setGeneratedStory({
        title: result.title,
        content: result.content,
        shareUrl: result.shareUrl,
      })
    } else {
      setError(result.error || 'Failed to generate story')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setGeneratedStory(null)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Impact Story
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!generatedStory ? (
          <>
            <DialogHeader>
              <DialogTitle>Generate Impact Story for {contactName}</DialogTitle>
              <DialogDescription>
                Create a personalized AI-generated story showing their impact
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_start">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Period Start (optional)
                  </Label>
                  <Input
                    id="period_start"
                    name="period_start"
                    type="date"
                    placeholder="Leave blank for all time"
                  />
                </div>
                <div>
                  <Label htmlFor="period_end">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Period End (optional)
                  </Label>
                  <Input
                    id="period_end"
                    name="period_end"
                    type="date"
                    placeholder="Leave blank for all time"
                  />
                </div>
              </div>

              <p className="text-sm text-neutral-600">
                Leave dates blank to generate a story based on all-time giving history.
              </p>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Story
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Impact Story Generated!</DialogTitle>
              <DialogDescription>
                Preview the story below and share it with {contactName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">
                  {generatedStory.title}
                </h3>
                <div className="prose prose-sm max-w-none text-neutral-700">
                  {generatedStory.content.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-md">
                <Label className="text-xs text-neutral-600">Shareable Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={generatedStory.shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedStory.shareUrl)
                      alert('Link copied to clipboard!')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    window.open(generatedStory.shareUrl, '_blank')
                  }}
                  className="flex-1"
                >
                  View Public Page
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
