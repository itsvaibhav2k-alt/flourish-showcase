'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateTonePreset } from '../actions/update-voice-settings'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

interface ToneSettingsProps {
  currentPreset: string
}

const tonePresets = [
  {
    value: 'warm',
    label: 'Warm',
    description: 'Friendly and personal, perfect for thank-you notes and relationship building',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and business-like, suitable for formal communications',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational, great for volunteer communications',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Traditional and respectful, ideal for official correspondence',
  },
  {
    value: 'spiritual',
    label: 'Spiritual',
    description: 'Faith-based and inspirational, connects on a deeper level',
  },
]

export function ToneSettings({ currentPreset }: ToneSettingsProps) {
  const [preset, setPreset] = useState(currentPreset || 'warm')
  const [isUpdating, setIsUpdating] = useState(false)

  const handlePresetChange = async (value: string) => {
    setPreset(value)
    setIsUpdating(true)

    try {
      const result = await updateTonePreset(value)

      if (result.success) {
        toast.success('Tone preset updated successfully')
      } else {
        toast.error(result.error || 'Failed to update tone preset')
        // Revert on error
        setPreset(currentPreset || 'warm')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error updating tone preset:', error)
      setPreset(currentPreset || 'warm')
    } finally {
      setIsUpdating(false)
    }
  }

  const selectedTone = tonePresets.find(t => t.value === preset)

  return (
    <Card className="shadow-card border-neutral-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-500" />
          <div>
            <CardTitle className="text-lg">Tone Preset</CardTitle>
            <CardDescription className="mt-1">
              Choose how AI should write emails for your organization
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tone-preset">Tone</Label>
          <Select
            value={preset}
            onValueChange={handlePresetChange}
            disabled={isUpdating}
          >
            <SelectTrigger id="tone-preset" className="w-full">
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {tonePresets.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTone && (
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-sm text-neutral-600">
              <span className="font-medium text-neutral-900">{selectedTone.label}:</span>{' '}
              {selectedTone.description}
            </p>
          </div>
        )}

        <div className="text-xs text-neutral-500 pt-2 border-t">
          <p className="mb-1 font-medium text-neutral-700">How it works:</p>
          <p>
            The AI will adapt its writing style based on this tone when generating emails.
            This works alongside your voice profile to create authentic communications.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
