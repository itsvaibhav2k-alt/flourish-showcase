'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateImpactStory } from '@/modules/impact'
import { useRouter } from 'next/navigation'

interface GenerateImpactButtonProps {
  contactId: string
  isRegenerate?: boolean
}

export function GenerateImpactButton({ contactId, isRegenerate = false }: GenerateImpactButtonProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateImpactStory(contactId, 'all-time')

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to generate impact story')
      }
    } catch (err) {
      console.error('Error generating impact story:', err)
      setError('Failed to generate impact story')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="lg"
        className="bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {isRegenerate ? 'Regenerate Impact Story' : 'Generate Impact Story'}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
